const express = require("express")
require("dotenv").config()
const http = require("http")
const { Server } = require("socket.io")
const { connectDB } = require("./config/db")
const Board = require("./models/Board.model.js")
const Stroke = require("./models/Strokes.model.js")
const cors = require("cors")
connectDB()
const roomUsers = {}
const app = express()
app.use(cors({
    origin: "http://localhost:5173",
    credentials:true
}))
app.use(express.json({ limit: "10mb"}))
const saveTimer = {}
const MAX_UNDO = 50
const rooms = {}
const roomUndo = {} 
const roomRedo = {} 
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin:"http://localhost:5173",
        methods: ["GET", "POST"]
    }
})
console.log(process.env.JWT_SECRET)
const authRoutes = require("./routes/auth.routes.js")
app.use("/api/auth", authRoutes)
const boardRoutes = require("./routes/board.routes.js")
app.use("/api/boards", boardRoutes)

const sanitizeStroke = (s, userId, boardId) => ({
    id: s.id,
    strokeId: s.id,
    boardId,
    userId,

    tool: s.tool,
    color: s.color,
    width: s.width,
    opacity: s.opacity,
    fill: s.fill,
    style: s.style,
    rotation: s.rotation,
    groupId: s.groupId ?? null,

    points: Array.isArray(s.points)
        ? s.points.map(p => ({ x: p.x, y: p.y }))
        : [],
    center: s.center,
    rectSize: s.rectSize,
    text: s.text
})
const scheduleSave = (roomId, boardId) => {
    if (!rooms[roomId]) return

    if (saveTimer[roomId]) {
        clearTimeout(saveTimer[roomId])
    }

    saveTimer[roomId] = setTimeout(async () => {
        try {
            await Stroke.deleteMany({ boardId })

            const strokesToInsert = rooms[roomId]
            .filter(s => s.id)
            .map(s => sanitizeStroke(s, s.userId, boardId))

            if (strokesToInsert.length > 0) {
                await Stroke.insertMany(strokesToInsert)
            }

            console.log(`saved board ${roomId}`)
        } catch (error) {
            console.error("save failed:", error)
        }
    }, 500)
}

io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    socket.on("join-room",  async ({roomId, userId, username}) => {
        socket.join(roomId)
        socket.data.roomId = roomId
        socket.data.userId = userId
        const board = await Board.findOne({ roomId })

        if (!board) {
            return socket.disconnect()
        }

        // 🔥 ALWAYS set this
        socket.data.boardId = board._id

        if (!rooms[roomId]) {
            const strokes = await Stroke.find({ boardId: board._id }).lean()

            rooms[roomId] = strokes.map(s => ({
                ...s,
                id: s.strokeId   
            }))
        }
        if(!roomUsers[roomId]) roomUsers[roomId] = []
        roomUsers[roomId].push({
            socketId: socket.id,
            userId,
            username
        })
        io.to(roomId).emit("room-users", roomUsers[roomId])
        if(!roomRedo[roomId]) roomRedo[roomId] = []
        if(!roomUndo[roomId]) roomUndo[roomId] = []
        socket.emit("load-history", rooms[roomId])
        console.log(`Room joined ${roomId}`);
        
        console.log(`Socket ${socket.id} joined room ${roomId}`)
    })

    socket.on("stroke-complete", async (stroke) => {
        const roomId = socket.data.roomId
        const userId = socket.data.userId
        if (!roomId) return
        if (!rooms[roomId]) rooms[roomId] = []

        roomUndo[roomId].push(structuredClone(rooms[roomId]))
        if(roomUndo[roomId].length > MAX_UNDO){    
            roomUndo[roomId].shift()
        }
        roomRedo[roomId] = []
        const newStroke = {
            ...stroke,
            userId,
            groupId: stroke.groupId ?? null

        }
        
        rooms[roomId].push(newStroke)

        scheduleSave(roomId, socket.data.boardId)
        
        socket.broadcast.to(roomId).emit("stroke-complete", newStroke)
    })
    
    socket.on("stroke-move", async (stroke) => {
        const roomId = socket.data.roomId
        const userId = socket.data.userId  // ← was missing
        if(!roomId || !rooms[roomId]) return


        const index = rooms[roomId].findIndex(s => s.id === stroke.id)

        if(index !== -1){
            const existingUserId = rooms[roomId][index].userId
            // const previousPoints = structuredClone(rooms[roomId][index].points)  

            rooms[roomId][index] = {
                ...stroke,
                userId: existingUserId
            }
            scheduleSave(roomId, socket.data.boardId)
        }

        socket.broadcast.to(roomId).emit("stroke-move", stroke)
    })
    socket.on("stroke-move-start", ()=>{
        const roomId = socket.data.roomId
        if(!roomId || !rooms[roomId]) return

        roomUndo[roomId].push(structuredClone(rooms[roomId]))
        if(roomUndo[roomId].length > MAX_UNDO){
            roomUndo[roomId].shift()
        }
        roomRedo[roomId] = []
    })
    socket.on("stroke-delete",({ id })=>{
        const roomId  = socket.data.roomId
        if(!roomId || !rooms[roomId]) return 

        roomUndo[roomId].push(structuredClone(rooms[roomId]))
        if(roomUndo[roomId].length > MAX_UNDO){
            roomUndo[roomId].shift()
        }
        roomRedo[roomId] = []

        rooms[roomId] = rooms[roomId].filter(s=> s.id !== id)

        scheduleSave(roomId, socket.data.boardId)

        socket.broadcast.to(roomId).emit("stroke-delete", {id})
    })
    
    socket.on("strokes-reorder", async (updatedStrokes) => {
        try {
            const roomId = socket.data.roomId
            if (!roomId || !rooms[roomId]) return

            roomUndo[roomId].push(structuredClone(rooms[roomId]))
            if (roomUndo[roomId].length > MAX_UNDO) {
                roomUndo[roomId].shift()
            }

            roomRedo[roomId] = []

            rooms[roomId] = updatedStrokes

            scheduleSave(roomId, socket.data.boardId)

            socket.broadcast.to(roomId).emit("strokes-reordered", updatedStrokes)
        } catch (err) {
            console.error("Error reordering strokes:", err)
        }
    })

    socket.on("undo", () => {
        const roomId = socket.data.roomId
        if (!roomId || !roomUndo[roomId] || roomUndo[roomId].length === 0) return

        const currentState = structuredClone(rooms[roomId])

        const prevState = roomUndo[roomId].pop()

        roomRedo[roomId].push(currentState)
        if(roomRedo[roomId].length > MAX_UNDO){
            roomRedo[roomId].shift()
        }

        rooms[roomId] = prevState

        io.to(roomId).emit("load-history", rooms[roomId])
    })

    socket.on("redo", () => {
    const roomId = socket.data.roomId
    if (!roomId || !roomRedo[roomId] || roomRedo[roomId].length === 0) return

    const currentState = structuredClone(rooms[roomId])

    const nextState = roomRedo[roomId].pop()

    roomUndo[roomId].push(currentState)

    rooms[roomId] = nextState

    io.to(roomId).emit("load-history", rooms[roomId])
    })
    socket.on("strokes-move", async (updatedStrokes) => {
        const roomId = socket.data.roomId
        if (!roomId || !rooms[roomId]) return

        updatedStrokes.forEach((updatedStroke) => {
            const index = rooms[roomId].findIndex(s => s.id === updatedStroke.id)

            if (index !== -1) {
                rooms[roomId][index] = {
                    ...updatedStroke,   // ✅ trust full object
                    userId: rooms[roomId][index].userId
                }
            }
        })

        scheduleSave(roomId, socket.data.boardId)

        socket.broadcast.to(roomId).emit("strokes-move", updatedStrokes)
    })
    socket.on("strokes-add-bulk", async (newStrokes) => {
        const roomId = socket.data.roomId
        const userId = socket.data.userId

        if (!roomId) return
        if (!rooms[roomId]) rooms[roomId] = []

        // 🔥 FIX: always convert to array
        const strokesArray = Array.isArray(newStrokes) ? newStrokes : [newStrokes]

        // undo snapshot
        roomUndo[roomId].push(structuredClone(rooms[roomId]))
        if (roomUndo[roomId].length > MAX_UNDO) {
            roomUndo[roomId].shift()
        }
        roomRedo[roomId] = []

        const normalizedStrokes = strokesArray.map(stroke =>
            sanitizeStroke(stroke, userId, socket.data.boardId)
        )

        const formatted = normalizedStrokes.map(s => ({
            ...s,
            id: s.strokeId 
        }))

        rooms[roomId].push(...formatted)

        scheduleSave(roomId, socket.data.boardId)

        socket.broadcast.to(roomId).emit("strokes-add-bulk", normalizedStrokes)
    })
    socket.on("cursor-move", ({roomId, x, y, userId, username}) => {
        socket.to(roomId).emit("cursor-update", {
            x,
            y,
            socketId: socket.id,
            username
        })
    })

    socket.on("disconnect", async () => {
        const roomId = socket.data.roomId
        if(!roomId || !roomUsers[roomId]) return

        roomUsers[roomId] = roomUsers[roomId].filter(
            u => u.socketId !== socket.id 
        )
        io.to(roomId).emit("room-users", roomUsers[roomId])

        io.to(roomId).emit("user-disconnected", socket.id)
        
        if(saveTimer[roomId]){
            clearTimeout(saveTimer[roomId])
            
            await Stroke.deleteMany({ boardId: socket.data.boardId })

            const strokesToInsert = rooms[roomId]
            .filter(s => s.id)   
            .map(s => sanitizeStroke(s, s.userId, socket.data.boardId))

            if (strokesToInsert.length > 0) {
                await Stroke.insertMany(strokesToInsert)
            }
        }
        console.log("User disconnected:", socket.id)
    })
    
    socket.on("delete-selected", async (ids) => {
        const roomId = socket.data.roomId
        if (!roomId || !rooms[roomId]) return

        roomUndo[roomId].push(structuredClone(rooms[roomId]))
        if (roomUndo[roomId].length > MAX_UNDO) {
            roomUndo[roomId].shift()
        }

        roomRedo[roomId] = []

        rooms[roomId] = rooms[roomId].filter(stroke => !ids.includes(stroke.id))

        scheduleSave(roomId, socket.data.boardId)

        socket.broadcast.to(roomId).emit("delete-selected", ids)
    })
})

server.listen(5000, ()=>{
    console.log("Server running on port 5000")
})