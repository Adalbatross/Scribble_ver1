import React from 'react'
import {io} from "socket.io-client"
import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
const Board = () => {
    const {id} = useParams()
    console.log(`Boards's ID : ${id}`) 
    const canvasRef = useRef(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const strokeRef = useRef([])
    const socketRef = useRef(null)
    const pendingStrokeRef = useRef(null)
    const animationFrameRef = useRef(null)
    const currentStrokeRef = useRef(null)
    const userIdRef = useRef(null)
    if(! userIdRef.current){
        const existing = localStorage.getItem("scribble-user-id")
        if(existing){
            userIdRef.current = existing
        }else{
            const newId = crypto.randomUUID()
            localStorage.setItem("scribble-user-id", newId)
            userIdRef.current = newId
        }
    }
    const redraw = () => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        ctx.lineWidth = 5
        ctx.lineCap = "round"
        ctx.strokeStyle = "black"

        strokeRef.current.forEach(stroke => {
            if (!stroke.points.length) return

            ctx.beginPath()
            const first = stroke.points[0]
            ctx.moveTo(first.x, first.y)

            for (let i = 1; i < stroke.points.length; i++) {
                const point = stroke.points[i]
                ctx.lineTo(point.x, point.y)
            }

            ctx.stroke()
        })
    }
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return 
        const ctx = canvas.getContext("2d")
        const resizeCanvas = () => {
            // const strokes = roomCacheRef.current 
            canvas.width = canvas.offsetWidth
            canvas.height = canvas.offsetHeight
            redraw()
        }

        resizeCanvas()
        window.addEventListener("resize", resizeCanvas)
        ctx.lineWidth = 5
        ctx.lineCap = "round"
        ctx.strokeStyle = "black"
        socketRef.current = io("http://localhost:5000")
        socketRef.current.on("connect",()=>{
            console.log("Connected to the server:", socketRef.current.id);
        })
        socketRef.current.emit("join-room", {
            roomId: id,
            userId: userIdRef.current
        })
        socketRef.current.on("stroke-complete", (stroke)=>{
            strokeRef.current.push(stroke)
            redraw()
        })
        socketRef.current.on("load-history", (strokes)=>{
            strokeRef.current = strokes
            redraw()
        })
        const emitLoop  = ()=>{
            if(pendingStrokeRef.current && socketRef.current){
                socketRef.current.emit("draw",pendingStrokeRef.current)
                pendingStrokeRef.current = null
            }
            animationFrameRef.current = requestAnimationFrame(emitLoop)
        }
        animationFrameRef.current = requestAnimationFrame(emitLoop)
        return ()=>{
            cancelAnimationFrame(animationFrameRef.current)
            window.removeEventListener("resize", resizeCanvas)
            socketRef.current.disconnect()
        }
    }, [id])
    const handleMouseMove = (e) => {
        if (!isDrawing) return 
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext("2d");
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const stroke = currentStrokeRef.current
        if(!stroke) return 
        const lastPoint = stroke.points[stroke.points.length - 1]
        ctx.beginPath()
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke()

        stroke.points.push({x,y})

    }
    const handleMouseDown = (e) => {
        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        currentStrokeRef.current = {
            id: crypto.randomUUID(),
            points: [{x,y}]
        }
        setIsDrawing(true)

        console.log("Mouse Down at:",x,y)
    }
    const handleMouseUp = () => {
        if(!currentStrokeRef.current) return
        strokeRef.current.push(currentStrokeRef.current)
        socketRef.current.emit("stroke-complete", currentStrokeRef.current)
        currentStrokeRef.current = null
        setIsDrawing(false)
    }
  return (
    <div className="h-screen flex flex-col bg-white">

      {/* Navbar */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <div className="font-semibold">Scribble</div>
        <div className="text-sm text-gray-500">Board: {id}</div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Toolbar */}
        <div className="w-16 border-r flex flex-col items-center py-4 space-y-6 bg-gray-50">
          <button className="w-10 h-10 rounded-md bg-black"></button>
          <button  onClick={()=>socketRef.current.emit("undo")} 
            className="w-10 h-10 rounded-md border">U</button>
          <button className="w-10 h-10 rounded-md border"></button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-gray-100">
          <canvas className="w-full h-full"
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseLeave={handleMouseUp}
         onMouseUp={handleMouseUp}
         ref={canvasRef}
          ></canvas>
        </div>

      </div>
    </div>
  )
}

export default Board