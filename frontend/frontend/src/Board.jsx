import React from 'react'
import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
const Board = () => {
    const canvasRef = useRef(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const lastX = useRef(0)
    const lastY = useRef(0)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return 
        const ctx = canvas.getContext("2d")
        ctx.lineWidth = 5
        ctx.lineCap = "round"
        ctx.strokeStyle = "black"
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