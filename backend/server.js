const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const { connectDB } = require("./db")
const Board = require("./models/Board.model")
connectDB()
const roomUsers = {}
const app = express()
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
const scheduleSave = (roomId) =>{
    if(!rooms[roomId]) return 

    if(saveTimer[roomId]){
        clearTimeout(saveTimer[roomId])
    }

    saveTimer[roomId] = setTimeout(async()=>{
        try {  
            await Board.findByIdAndUpdate(roomId, {
                strokes: rooms[roomId]
            })
            console.log(`saved board ${roomId}`);
        } catch (error) {
            console.error("save failed: ", error)
        }
    },500)
}

io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    socket.on("join-room",  async ({roomId, userId}) => {
        socket.join(roomId)
        socket.data.roomId = roomId
        socket.data.userId = userId
        if(!rooms[roomId]){
            const board = await Board.findById(roomId).lean()
            if(board){
                rooms[roomId] = board.strokes
            }else{
                rooms[roomId] = []
                await Board.create({
                    _id: roomId,
                    strokes: []
                })
            }
        }
        if(!roomUsers[roomId]) roomUsers[roomId] = []
        roomUsers[roomId].push({
            socketId: socket.id,
            userId
        })
        io.to(roomId).emit("room-users", roomUsers[roomId])
        if(!roomRedo[roomId]) roomRedo[roomId] = []
        if(!roomUndo[roomId]) roomUndo[roomId] = []
        socket.emit("load-history", rooms[roomId])
        console.log(`Room created ${roomId}`);
        
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
        await scheduleSave(roomId)
        
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
            await scheduleSave(roomId)
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

        scheduleSave(roomId)

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

            scheduleSave(roomId)

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

        scheduleSave(roomId)

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

        const normalizedStrokes = strokesArray.map(stroke => ({
            ...stroke,
            userId,
            groupId: stroke.groupId ?? null
        }))

        rooms[roomId].push(...normalizedStrokes)

        scheduleSave(roomId)

        socket.broadcast.to(roomId).emit("strokes-add-bulk", normalizedStrokes)
    })

    socket.on("disconnect", async () => {
        const roomId = socket.data.roomId
        if(!roomId || !roomUsers[roomId]) return

        roomUsers[roomId] = roomUsers[roomId].filter(
            u => u.socketId !== socket.id 
        )
        io.to(roomId).emit("room-users", roomUsers[roomId])
        
        if(saveTimer[roomId]){
            clearTimeout(saveTimer[roomId])
            
            await Board.findByIdAndUpdate(roomId, {
                strokes: rooms[roomId]
            })
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

        scheduleSave(roomId)

        socket.broadcast.to(roomId).emit("delete-selected", ids)
    })
})

server.listen(5000, ()=>{
    console.log("Server running on port 5000")
})