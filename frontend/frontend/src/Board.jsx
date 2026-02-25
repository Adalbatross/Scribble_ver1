import React from 'react'
import {io} from "socket.io-client"
import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
const Board = () => {
    const canvasRef = useRef(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const lastX = useRef(0)
    const lastY = useRef(0)
    // const lastEmitTime = useRef(0)
    const socketRef = useRef(null)
    const pendingStrokeRef = useRef(null)
    const animationFrameRef = useRef(null)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return 
        const ctx = canvas.getContext("2d")
        ctx.lineWidth = 5
        ctx.lineCap = "round"
        ctx.strokeStyle = "black"
        socketRef.current = io("http://localhost:5000")
        socketRef.current.on("connect",()=>{
            console.log("Connected to the server:", socketRef.current.id);
        })
        socketRef.current.emit("join-room", "test123")
        socketRef.current.on("draw",(data)=>{
            const ctx = canvas.getContext("2d")
            ctx.beginPath()
            ctx.moveTo(data.x0,data.y0)
            ctx.lineTo(data.x1,data.y1)
            ctx.stroke()
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
            socketRef.current.disconnect()
        }
    }, [])
    const handleMouseMove = (e) => {
        if (!isDrawing) return 
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext("2d");
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.beginPath()
        ctx.moveTo(lastX.current, lastY.current);
        ctx.lineTo(x, y);
        ctx.stroke();
        pendingStrokeRef.current = {
            x0: lastX.current,
            y0: lastY.current,
            x1: x,
            y1: y
        }
        lastX.current = x;
        lastY.current = y;

    }
    const handleMouseDown = (e) => {
        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        lastX.current = x
        lastY.current = y

        setIsDrawing(true)

        console.log("Mouse Down at:",x,y)
    }
    const handleMouseUp = () => {
        setIsDrawing(false)
    }
     return (
        <div>
       <div>Draw anything that you like: Down Below </div>
       <canvas
         style={{ border: "4px solid black" }}
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseLeave={handleMouseUp}
         onMouseUp={handleMouseUp}
         ref={canvasRef}
         width={800}
         height={600}
       />
       </div>
     );
}

export default Board