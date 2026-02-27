const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const rooms = {}
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
        if(!rooms[roomId]){
            rooms[roomId] = [] // this creates the roomhistory if there is no room for the user that has joined to save the memory of the code
        }
        socket.emit("load-history", rooms[roomId]) //this sends the history that we have loaded to only the new joining user for that particular roomId  
        console.log(`Socket ${socket.id} joined room ${roomId}`)

    })
    socket.on("draw",(data)=>{
        const roomId = socket.data.roomId
        if(!roomId) return 
        if(!rooms[roomId]) return 
        rooms[roomId].push(data) // here we change the draw_handler to draw the history for the new joiny 
        socket.to(socket.data.roomId).emit("draw",data)
    })


    socket.on("disconnect", () => {
        const roomId = socket.data.roomId
        if(roomId){
            const clients = io.sockets.adapter.rooms.get(roomId)

            if(!clients || clients.size === 0 ){
                delete rooms[roomId]
                console.log(`Room ${roomId} deleted `);
                
            }
        }
        console.log("User disconnected:", socket.id)
    })
})

server.listen(5000, ()=>{
    console.log("Server running on port 5000");
    
})
