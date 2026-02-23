const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin:"http://localhost:5173",
        methods: ["GET", "POST"]
    }
})

io.on("connection", (socket) => {
    console.log("User connected:", socket.id)
    socket.on("join-room", (roomId) => {
        socket.join(roomId)
        socket.data.roomId = roomId
        console.log(`Socket ${socket.id} joined room ${roomId}`)

    })
    socket.on("draw",(data)=>{
        if(!socket.data.roomId) return 
        socket.to(socket.data.roomId).emit("draw",data)
    })


    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id)
    })
})

server.listen(5000, ()=>{
    console.log("Server running on port 5000");
    
})
