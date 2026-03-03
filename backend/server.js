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
    socket.on("join-room", ({roomId, userId}) => {
        socket.join(roomId)
        socket.data.roomId = roomId
        socket.data.userId = userId
        if(!rooms[roomId]){
            rooms[roomId] = [] // this creates the roomhistory if there is no room for the user that has joined to save the memory of the code
        }
        socket.emit("load-history", rooms[roomId]) //this sends the history that we have loaded to only the new joining user for that particular roomId  
        console.log(`Socket ${socket.id} joined room ${roomId}`)

    })
    socket.on("stroke-complete", (stroke) => {
        const roomId = socket.data.roomId
        const userId = socket.data.userId
        if (!roomId) return

        if (!rooms[roomId]) {
            rooms[roomId] = []
        }

        const newStroke = {
            id: stroke.id,
            userId: userId, // persistent identity
            points: stroke.points
        }

        rooms[roomId].push(newStroke)

        socket.to(roomId).emit("stroke-complete", newStroke)
    })
    socket.on("undo", ()=>{
        const roomId = socket.data.roomId
        console.log("undo recieved from ",socket.id);
        
        if(!roomId || !rooms[roomId]) return 
        const userId = socket.data.userId
        
        for(let i= rooms[roomId].length -1; i>=0; i--){
            if(rooms[roomId][i].userId === userId){
                console.log("before Undo:", rooms[roomId].length);
                rooms[roomId].splice(i,1)
                console.log("after Undo:", rooms[roomId].length);
                break
            }
        }
        io.to(roomId).emit("load-history", rooms[roomId])
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
