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
    const lastX = useRef(0)
    const lastY = useRef(0)
    const strokeRef = useRef([])
    const socketRef = useRef(null)
    const pendingStrokeRef = useRef(null)
    const animationFrameRef = useRef(null)
    const redraw  = ()=>{
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")

        ctx.clearRect(0,0, canvas.width, canvas.height)
        strokeRef.current.forEach((stroke) => {
            ctx.beginPath()
            ctx.moveTo(stroke.x0 * canvas.width ,stroke.y0 * canvas.height)
            ctx.lineTo(stroke.x1 * canvas.width ,stroke.y1 * canvas.height)
            ctx.stroke()
        })
    }
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return 
        const ctx = canvas.getContext("2d")
        const resizeCanvas = () => {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight

        const ctx = canvas.getContext("2d")
        ctx.lineWidth = 5
        ctx.lineCap = "round"
        ctx.strokeStyle = "black"

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
        socketRef.current.emit("join-room", id)
        socketRef.current.on("draw",(data)=>{
            strokeRef.current.push(data)
            const ctx = canvas.getContext("2d")
            ctx.beginPath()
            ctx.moveTo(data.x0 * canvas.width ,data.y0 * canvas.height)
            ctx.lineTo(data.x1 * canvas.width ,data.y1 * canvas.height)
            ctx.stroke()
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
        const raw_x = e.clientX - rect.left;
        const raw_y = e.clientY - rect.top;
        const x = raw_x / canvas.width
        const y = raw_y / canvas.height
        ctx.beginPath()
        ctx.moveTo(
        lastX.current * canvas.width,
        lastY.current * canvas.height
        );
        ctx.lineTo(x * canvas.width, y * canvas.height);
        ctx.stroke();
        pendingStrokeRef.current = {
            x0: lastX.current,
            y0: lastY.current,
            x1: x,
            y1: y
        }
        strokeRef.current.push(pendingStrokeRef.current)
        lastX.current = x;
        lastY.current = y;

    }
    const handleMouseDown = (e) => {
        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const rawX = e.clientX - rect.left
        const rawY = e.clientY - rect.top

        const x = rawX / canvas.width
        const y = rawY / canvas.height

        lastX.current = x
        lastY.current = y

        setIsDrawing(true)

        console.log("Mouse Down at:",x,y)
    }
    const handleMouseUp = () => {
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