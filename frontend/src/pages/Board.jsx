import React from 'react'
import {io} from "socket.io-client"
import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Toolbar from '../components/Toolbar'

const Board = () => {
    const {id} = useParams()
    console.log(`Boards's ID : ${id}`) 
    const canvasRef = useRef(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const strokeRef = useRef([])
    const socketRef = useRef(null)
    const offsetXRef = useRef(0)
    const offsetYRef = useRef(0)
    const isPanningRef = useRef(false)
    const panStartRef = useRef({x:0, y:0})
    const spacePressRef = useRef(false)
    const currentStrokeRef = useRef(null)
    const userIdRef = useRef(null)
    const [tool, setTool] = useState("pen")
    const [color, setColor] = useState("black")
    const [brushSize, setBrushSize] = useState(5)
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
        ctx.save()
        ctx.lineWidth = 5
        ctx.lineCap = "round"
        
        ctx.translate(offsetXRef.current, offsetYRef.current)
        strokeRef.current.forEach(stroke => {

            if (!stroke.points.length) return
            ctx.lineWidth = stroke.width
            ctx.strokeStyle = stroke.color

            ctx.beginPath()

            if (stroke.tool === "eraser") {
                ctx.globalCompositeOperation = "destination-out"
            } else {
                ctx.globalCompositeOperation = "source-over"
            }

            const first = stroke.points[0]
            ctx.moveTo(first.x, first.y)

            for (let i = 1; i < stroke.points.length; i++) {
                const point = stroke.points[i]
                ctx.lineTo(point.x, point.y)
            }

            ctx.stroke()
        })
        ctx.restore()
        ctx.globalCompositeOperation = "source-over"
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
        const handleKeyDown = (e)=>{
            if(e.code === "Space"){
                spacePressRef.current = true
            }
            canvasRef.current.style.cursor = "grab"
        }
        const handleKeyUp = (e)=>{
            if(e.code === "Space"){
                spacePressRef.current = false
            }
            canvasRef.current.style.cursor = "default"
        }
        window.addEventListener("keydown",handleKeyDown)
        window.addEventListener("keyup",handleKeyUp)
        return ()=>{
            window.removeEventListener("resize", resizeCanvas)
            socketRef.current.disconnect()
        }
    }, [id])
    const handleMouseMove = (e) => {
        if(isPanningRef.current){
            const dx = e.clientX - panStartRef.current.x
            const dy = e.clientY - panStartRef.current.y
            offsetXRef.current += dx
            offsetYRef.current += dy

            panStartRef.current = {
                x: e.clientX,
                y: e.clientY
            }

            redraw()
            return 
        }
        if (!isDrawing) return 
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext("2d");
        const x = e.clientX - rect.left - offsetXRef.current;
        const y = e.clientY - rect.top - offsetYRef.current;
        const stroke = currentStrokeRef.current
        if(!stroke) return 
        const lastPoint = stroke.points[stroke.points.length - 1]
        ctx.save()
        ctx.translate(offsetXRef.current, offsetYRef.current)
        ctx.lineWidth = stroke.width
        ctx.strokeStyle = stroke.color
        ctx.beginPath()
        if(stroke.tool === "eraser"){
            ctx.globalCompositeOperation = "destination-out"
        }else{
            ctx.globalCompositeOperation = "source-over"
        }
        ctx.moveTo(lastPoint.x, lastPoint.y)
        ctx.lineTo(x,y)
        ctx.stroke()
        ctx.restore()

        stroke.points.push({x,y})

    }
    const handleMouseDown = (e) => {
        if(spacePressRef.current){
            isPanningRef.current = true
            panStartRef.current = {
                x: e.clientX,
                y: e.clientY
            }
            return 
        }
        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left - offsetXRef.current
        const y = e.clientY - rect.top - offsetYRef.current

        currentStrokeRef.current = {
            id: crypto.randomUUID(),
            tool: tool,
            color:color,
            width: brushSize,
            points: [{x,y}]
        }
        setIsDrawing(true)

        console.log("Mouse Down at:",x,y)
    }
    const handleMouseUp = () => {
        if(isPanningRef.current){
            isPanningRef.current = false
            return 
        }
        if(!currentStrokeRef.current) return
        strokeRef.current.push(currentStrokeRef.current)
        socketRef.current.emit("stroke-complete", currentStrokeRef.current)
        const ctx = canvasRef.current.getContext("2d")
        ctx.globalCompositeOperation = "source-over"
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
        <Toolbar 
            tool={tool}
            setTool={setTool}
            color = {color}
            setColor = {setColor}
            brushSize = {brushSize}
            setBrushSize = {setBrushSize}
            onUndo={()=>{socketRef.current.emit("undo")}}
        />

        {/* Canvas Area */}
        <div className="flex-1 relative bg-gray-100">
          <canvas className="w-full h-full bg-amber-50"
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