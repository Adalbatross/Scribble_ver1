const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin:"*"
    }
})

io.on("connection", (socket) => {
    console.log("User connected:", socket.id)
    socket.on("join-room", (roomId) => {
        socket.join(roomId)
        socket.roomId = roomId
        console.log(`Socket ${socket.id} joined room ${roomId}`)

    })
    socket.on("ping",() => {
        socket.to(socket.roomId).emit("pong")
    })




    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id)
    })
})
