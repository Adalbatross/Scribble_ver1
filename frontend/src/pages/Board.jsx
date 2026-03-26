import React from 'react'
import {io} from "socket.io-client"
import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Toolbar from '../components/Toolbar'
import { useCanvasInteractions } from '../hooks/useCanvasInteracions'
import ToolOptionsPanel from '../components/ToolOptionsPanel'

const Board = () => {
    const MIN_ZOOM = 0.1
    const MAX_ZOOM = 10
    const baseGridSize = 50
    const {id} = useParams()
    console.log(`Boards's ID : ${id}`)
    const socketRef = useRef(null)
    const spacePressRef = useRef(false)
    const userIdRef = useRef(null)
    const [tool, setTool] = useState("select")
    const [color, setColor] = useState("black")
    const [brushSize, setBrushSize] = useState(5)
    const [copied, setCopied] = useState(false)
    const [users, setUsers] = useState([])
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
    const handleCopy = async () => {
    const url = `${window.location.origin}/board/${id}`

    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    }
    
    const drawGrid = ()=> {
        const canvas = gridCanvasRef.current
        const ctx = canvas.getContext("2d")
        ctx.clearRect(0,0, canvas.width, canvas.height)
        const width = canvas.width
        const height = canvas.height
        
        const scale = scaleRef.current
        const offsetX = offsetXRef.current
        const offsetY = offsetYRef.current
        
        // const baseGridSize = 50
        
        let gridSize = baseGridSize
        if (gridSize * scale < 8) gridSize *= 2 
        if(scale< 0.5) gridSize *=4
        else if (scale<1) gridSize *= 2
        else if (scale>2) gridSize /= 2
        ctx.save()
        
        ctx.translate(offsetX, offsetY)
        ctx.scale(scale, scale)
        
        const startX = -offsetX / scale
        const startY = -offsetY / scale
        const endX = startX+ width / scale
        const endY = startY+ height / scale
        
        const firstX  = Math.floor(startX/gridSize) * gridSize
        const firstY  = Math.floor(startY/gridSize) * gridSize
        
        for(let x= firstX; x< endX; x+=gridSize){
            ctx.beginPath()
            if (Math.round(x / gridSize) % 10 === 0){
                ctx.strokeStyle = '#cfcfcf'
                ctx.lineWidth = 1.5
            }else{
                ctx.strokeStyle = '#e8e8e8'
                ctx.lineWidth = 1
            }
            
            ctx.moveTo(Math.round(x) +0.5 ,startY)
            ctx.lineTo(Math.round(x) + 0.5,endY)
            ctx.stroke()
        }
        for(let y= firstY; y< endY; y+=gridSize){
            ctx.beginPath()
            if (Math.round(y / gridSize) % 10 === 0){
                ctx.strokeStyle = '#cfcfcf'
                ctx.lineWidth = 1.5
            }else{
                ctx.strokeStyle = '#e8e8e8'
                ctx.lineWidth = 1
            }
            
            ctx.moveTo(startX,Math.round(y)+0.5)
            ctx.lineTo(endX, Math.round(y)+0.5)
            ctx.stroke()
        }
        
        ctx.restore() 
        
    }
    const {canvasRef , gridCanvasRef,redraw, strokeRef,scaleRef, offsetXRef, offsetYRef, handlers, 

    } = useCanvasInteractions(tool, color, brushSize, socketRef, drawGrid, spacePressRef, userIdRef)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return 
        const ctx = canvas.getContext("2d")
        
        const resizeCanvas = () => {
            // const strokes = roomCacheRef.current 
            const canvas = canvasRef.current
            // eslint-disable-next-line react-hooks/immutability
            const gridCanvas = gridCanvasRef.current
            canvas.width = canvas.offsetWidth
            canvas.height = canvas.offsetHeight

            gridCanvas.width = gridCanvas.offsetWidth
            gridCanvas.height = gridCanvas.offsetHeight
            drawGrid()
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
        socketRef.current.on("room-users",(usersList) => {
            setUsers(usersList)
        })

        socketRef.current.emit("join-room", {
            roomId: id,
            userId: userIdRef.current
        })
        socketRef.current.on("stroke-complete", (stroke)=>{
            strokeRef.current.push(stroke)
            redraw()
        })
        socketRef.current.on("stroke-delete", ({id})=>{
            strokeRef.current = strokeRef.current.filter(s=>s.id !== id)
            drawGrid()
            redraw()
        })
        socketRef.current.on("stroke-move", (updatedStroke)=>{
            const index = strokeRef.current.findIndex(s=> s.id === updatedStroke.id)
            if(index !== -1){
                strokeRef.current[index] = updatedStroke
                drawGrid()
                redraw()
            }
        })
        socketRef.current.on("strokes-move", (updatedStrokes) => {
            updatedStrokes.forEach((updatedStroke) => {
                const index = strokeRef.current.findIndex(s => s.id === updatedStroke.id)

                if (index !== -1) {
                    strokeRef.current[index] = updatedStroke
                }
            })

            drawGrid()
            redraw()
        })
        socketRef.current.on("load-history", (strokes)=>{
            strokeRef.current = strokes
            drawGrid()
            redraw()
        })
        // socketRef.current.on("undo", (strokeId)=>{
        //     strokeRef.current = strokeRef.current.filter(s=> s.id !== strokeId)
        //     drawGrid()
        //     redraw()
        // })
        const handleWheel  = (e)=>{
            e.preventDefault()
            const zoomIntensity = 0.1
            const canvas = canvasRef.current
            const rect = canvas.getBoundingClientRect()

            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top

            const worldX = (mouseX - offsetXRef.current) / scaleRef.current
            const worldY = (mouseY - offsetYRef.current) / scaleRef.current

            const direction = e.deltaY > 0 ? -1 : 1
            const zoom = 1 + direction * zoomIntensity
            const newScale = scaleRef.current * zoom
            scaleRef.current  = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newScale))

            offsetXRef.current = mouseX - worldX * scaleRef.current
            offsetYRef.current = mouseY - worldY * scaleRef.current
            drawGrid()
            redraw()
        }
        const handleKeyDown = (e)=>{
            if(e.code === "Space"){
                spacePressRef.current = true
                canvasRef.current.style.cursor = "grab"
            }
            const isUndo = (e.ctrlKey || e.metaKey) && e.key === "z"
            const isRedo = (e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))

            if (isUndo) {
                e.preventDefault()
                socketRef.current.emit("undo")
            }

            if (isRedo) {
                e.preventDefault()
                socketRef.current.emit("redo")
            }         
        }
        const handleKeyUp = (e)=>{
            if(e.code === "Space"){
                spacePressRef.current = false
                canvasRef.current.style.cursor = "default"
            }
        }
        window.addEventListener("keydown",handleKeyDown)
        window.addEventListener("keyup",handleKeyUp)
        canvas.addEventListener("wheel", handleWheel, {passive: false})
        return ()=>{
            window.removeEventListener("resize", resizeCanvas)
            window.removeEventListener("keydown", handleKeyDown)
            window.removeEventListener("keyup", handleKeyUp)
            canvas.removeEventListener("wheel", handleWheel)
            socketRef.current.disconnect()
        }
    }, [id])

    


  return (
    <div className="h-screen w-screen relative bg-white overflow-hidden">

        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 ">

        {/* Toolbar */}
        <div className="flex items-center gap-2 bg-white shadow-md rounded-xl px-4 py-2 border">
            <Toolbar 
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            onUndo={() => socketRef.current.emit("undo")}
            onRedo={() => socketRef.current.emit("redo")}
            />
        </div>
        </div>
                {/* Tool Panel */}
        <div className="absolute top-20 left-4 z-20"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        >
        <ToolOptionsPanel
            tool={tool}
            color={color}
            setColor={setColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
        />
        </div>

        <div className="absolute top-4 right-4 z-20">
        <div className="bg-white shadow-md rounded-xl px-4 py-3 border text-sm flex flex-col gap-2">

            {/* Room ID */}
            <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-gray-700">
                Board
            </span>

            <button
                onClick={handleCopy}
                className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition"
            >
                {copied ? "Copied!" : "Copy"}
            </button>
            </div>

            <div className="text-gray-500 text-xs break-all">
            {id}
            </div>

            {/* Users */}
            <div className="text-gray-500 text-xs">
            {users.length} member{users.length !== 1 ? "s" : ""}
            </div>

            {/* Avatars */}
            <div className="flex gap-1">
            {users.map(u => (
                <div
                key={u.socketId}
                className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs"
                >
                {u.userId.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase()}
                </div>
            ))}
            </div>

        </div>
        </div>
        
        {/* Canvas Area */}
        <div className="absolute inset-0 bg-gray-100">
            <canvas className="absolute inset-0 w-full h-full"
            ref={canvasRef}
            onMouseDown={handlers.onMouseDown}
            onMouseMove={handlers.onMouseMove}
            onMouseUp={handlers.onMouseUp}
            onMouseLeave={handlers.onMouseLeave}
            style={{zIndex: 2, border: "2px solid red"}}
        />
            <canvas 
            ref={gridCanvasRef}
            className='absolute inset-0 w-full h-full pointer-events-none'
            style={{zIndex: 1, border: "2px solid blue"}}
            />
             {/* Drawing canvas */}
        </div>

    </div>
  )
}

export default Board