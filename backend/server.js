const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const rooms = {}
const roomHistory = {}  
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin:"http://localhost:5173",
        methods: ["GET", "POST"]
    }
})

io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    socket.on("join-room", ({roomId, userId}) => {
        socket.join(roomId)
        socket.data.roomId = roomId
        socket.data.userId = userId
        if(!rooms[roomId]) rooms[roomId] = []
        if(!roomHistory[roomId]) roomHistory[roomId] = []
        socket.emit("load-history", rooms[roomId])
        console.log(`Socket ${socket.id} joined room ${roomId}`)
    })

    socket.on("stroke-complete", (stroke) => {
        const roomId = socket.data.roomId
        const userId = socket.data.userId
        if (!roomId) return
        if (!rooms[roomId]) rooms[roomId] = []
        if (!roomHistory[roomId]) roomHistory[roomId] = []

        const newStroke = {
            id: stroke.id,
            userId,
            tool: stroke.tool,
            color: stroke.color,
            width: stroke.width,
            points: stroke.points
        }

        rooms[roomId].push(newStroke)
        roomHistory[roomId].push({
            type: "add",
            userId,
            strokeId: newStroke.id
        })

        socket.broadcast.to(roomId).emit("stroke-complete", newStroke)
    })

    socket.on("stroke-move", (stroke) => {
        const roomId = socket.data.roomId
        const userId = socket.data.userId  // ← was missing
        if(!roomId || !rooms[roomId]) return

        const index = rooms[roomId].findIndex(s => s.id === stroke.id)
        if(index !== -1){
            const existingUserId = rooms[roomId][index].userId
            const previousPoints = structuredClone(rooms[roomId][index].points)  

            rooms[roomId][index] = {
                ...stroke,
                userId: existingUserId
            }

            roomHistory[roomId].push({
                type: "move",
                userId,           
                strokeId: stroke.id,
                previousPoints: structuredClone(previousPoints)    
            })
        }

        socket.broadcast.to(roomId).emit("stroke-move", stroke)
    })

    socket.on("undo", () => {
        const roomId = socket.data.roomId
        const userId = socket.data.userId
        if(!roomId || !rooms[roomId] || !roomHistory[roomId]) return

        let actionIndex = -1
        for(let i = roomHistory[roomId].length - 1; i >= 0; i--){
            if(roomHistory[roomId][i].userId === userId){
                actionIndex = i
                break
            }
        }

        if(actionIndex === -1) return

        const action = roomHistory[roomId][actionIndex]
        roomHistory[roomId].splice(actionIndex, 1)

        if(action.type === "add"){
            rooms[roomId] = rooms[roomId].filter(s => s.id !== action.strokeId)
            io.to(roomId).emit("undo", action.strokeId)

        } else if(action.type === "move"){
            const index = rooms[roomId].findIndex(s => s.id === action.strokeId)
            if(index !== -1){
                rooms[roomId][index].points = action.previousPoints  
                io.to(roomId).emit("stroke-move", rooms[roomId][index])
            }
        }
    })

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id)
    })
})

server.listen(5000, ()=>{
    console.log("Server running on port 5000")
})