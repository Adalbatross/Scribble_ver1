import React from 'react'
import {io} from "socket.io-client"
import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Toolbar from '../components/Toolbar'

const Board = () => {
    const MIN_ZOOM = 0.1
    const MAX_ZOOM = 10
    const gridCanvasRef = useRef(null)
    const lastMouseRef = useRef({x:0, y:0})
    const baseGridSize = 50
    const {id} = useParams()
    console.log(`Boards's ID : ${id}`) 
    const canvasRef = useRef(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const strokeRef = useRef([])
    const scaleRef = useRef(1)
    const socketRef = useRef(null)
    const offsetXRef = useRef(0)
    const offsetYRef = useRef(0)
    const isPanningRef = useRef(false)
    const panStartRef = useRef({x:0, y:0})
    const spacePressRef = useRef(false)
    const currentStrokeRef = useRef(null)
    const userIdRef = useRef(null)
    const selectedStrokeRef  = useRef(null)
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
    const getStrokeAtPoint = (x,y) =>{
        for (let i  = strokeRef.current.length -1; i>=0; i--){
            const stroke = strokeRef.current[i]
            if(stroke.tool === "rect" && stroke.points.length >=2){
                const p1 = stroke.points[0]
                const p2 = stroke.points[1]

                const minX = Math.min(p1.x, p2.x)
                const maxX = Math.max(p1.x, p2.x)
                
                const minY = Math.min(p1.y, p2.y)
                const maxY = Math.max(p1.y, p2.y)

                if(x>= minX && x<=maxX && y>=minY && y<= maxY){
                    return stroke
                }

            }
        }
        return null
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
    const drawStroke = (ctx, stroke) =>{
        if (!stroke.points.length) return
        ctx.lineWidth = stroke.width
        ctx.strokeStyle = stroke.color
        
        
        if (stroke.tool === "eraser") {
            ctx.globalCompositeOperation = "destination-out"
        } else {
            ctx.globalCompositeOperation = "source-over"
        }
        if (stroke.tool == "pen" || stroke.tool == "eraser"){
            ctx.beginPath()
            const first = stroke.points[0]
            ctx.moveTo(first.x, first.y)
            
            for (let i = 1; i < stroke.points.length; i++) {
                const point = stroke.points[i]
                ctx.lineTo(point.x, point.y)
            }
            
            ctx.stroke()
        }
        if (stroke.tool === "rect"){
            if(stroke.points.length < 2) return 
            const p1 = stroke.points[0]
            const p2 = stroke.points[1]
            
            const width = p2.x -p1.x
            const height = p2.y -p1.y

            ctx.beginPath()
            ctx.rect(p1.x, p1.y, width, height)
            ctx.stroke()
        }
        if(stroke.tool === "line" && stroke.points.length >= 2){
            const p1 = stroke.points[0]
            const p2 = stroke.points[1]

            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
        }
        if (stroke.tool === "circle" && stroke.points.length>=2){
            const p1 = stroke.points[0]
            const p2 = stroke.points[1]

            const dx = p2.x - p1.x
            const dy = p2.y - p1.y

            const radius  = Math.sqrt(dx*dx + dy*dy)
            ctx.beginPath()
            ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2)
            ctx.stroke()
        }
    }
    const drawSelectionBox = (ctx, stroke) =>{
        if(!stroke || stroke.points.length < 2) return 
        const p1 = stroke.points[0]
        const p2 = stroke.points[1]

        const minX = Math.min(p1.x, p2.x)
        const maxX = Math.max(p1.x, p2.x)

        const minY = Math.min(p1.y, p2.y)
        const maxY = Math.max(p1.y, p2.y)

        const width = maxX - minX
        const height = maxY - minY

        ctx.save()

        ctx.strokeStyle = "#1E90FF"
        ctx.lineWidth  = 2 / scaleRef.current
        ctx.setLineDash([8,4])
        ctx.strokeRect(minX , minY, width, height)
        ctx.restore()
    }
    const redraw = () => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.save()
        ctx.lineWidth = 5
        ctx.lineCap = "round"
        
        ctx.translate(offsetXRef.current, offsetYRef.current)
        ctx.scale(scaleRef.current, scaleRef.current)
        strokeRef.current.forEach(stroke => {
            drawStroke(ctx, stroke)
        })
        if(selectedStrokeRef.current){
            drawSelectionBox(ctx, selectedStrokeRef.current)
        }
        if(currentStrokeRef.current){
            drawStroke(ctx, currentStrokeRef.current)
        }
        ctx.restore()
        ctx.globalCompositeOperation = "source-over"
    }
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return 
        const ctx = canvas.getContext("2d")
        
        const resizeCanvas = () => {
            // const strokes = roomCacheRef.current 
            const canvas = canvasRef.current
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
        socketRef.current.emit("join-room", {
            roomId: id,
            userId: userIdRef.current
        })
        socketRef.current.on("stroke-complete", (stroke)=>{
            strokeRef.current.push(stroke)
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
        socketRef.current.on("load-history", (strokes)=>{
            strokeRef.current = strokes
            drawGrid()
            redraw()
        })
        socketRef.current.on("undo", (strokeId)=>{
            strokeRef.current = strokeRef.current.filter(s=> s.id !== strokeId)
            drawGrid()
            redraw()
        })
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
            drawGrid()
            redraw()
            return 
        }
        if (!isDrawing) return 
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext("2d");
        const x = (e.clientX - rect.left - offsetXRef.current) / scaleRef.current;
        const y = (e.clientY - rect.top - offsetYRef.current) / scaleRef.current;
        const stroke = currentStrokeRef.current
        if(tool === "select" && selectedStrokeRef.current && isDrawing){

            const stroke = selectedStrokeRef.current

            const dx = x - lastMouseRef.current.x
            const dy = y - lastMouseRef.current.y

            stroke.points.forEach(p => {
                p.x += dx
                p.y += dy
            })

            lastMouseRef.current = { x, y }

            drawGrid()
            redraw()

            return
        }
        if(!stroke) return 
        if(stroke.tool === "rect" || stroke.tool === "line" || stroke.tool === "circle"){
            stroke.points[1] = {x,y}
            drawGrid()
            redraw()

            return
        }
        const lastPoint = stroke.points[stroke.points.length - 1]
        ctx.save()
        ctx.translate(offsetXRef.current, offsetYRef.current)
        ctx.scale(scaleRef.current, scaleRef.current)
        ctx.lineWidth = stroke.width
        ctx.strokeStyle = stroke.color
        if(stroke.tool === "eraser"){
            ctx.globalCompositeOperation = "destination-out"
        }else{
            ctx.globalCompositeOperation = "source-over"
        }
        ctx.beginPath()
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
        const x = (e.clientX - rect.left - offsetXRef.current) / scaleRef.current
        const y = (e.clientY - rect.top - offsetYRef.current) / scaleRef.current
        if(tool === "select"){
            const stroke = getStrokeAtPoint(x,y)
            if(stroke){
                selectedStrokeRef.current = stroke
                lastMouseRef.current = {x,y}
                setIsDrawing(true)
            }else{
                selectedStrokeRef.current = null
                redraw()
            }
            return
        }
        currentStrokeRef.current = {
            id: crypto.randomUUID(),
            tool: tool,
            color:color,
            width: brushSize,
            points: [{x,y}]
        }
        if(tool === "rect" || tool === "line" || tool === "circle"){
            currentStrokeRef.current.points.push({x,y})
        }
        setIsDrawing(true)

        console.log("Mouse Down at:",x,y)
    }
    const handleMouseUp = () => {
        if(isPanningRef.current){
            isPanningRef.current = false
            return 
        }
        if(tool === "select"){
            if(selectedStrokeRef.current){
                socketRef.current.emit("stroke-move", selectedStrokeRef.current)
            }
            selectedStrokeRef.current = null
            setIsDrawing(false)
            drawGrid()
            redraw()

            return
        }
        if(!currentStrokeRef.current) return
        strokeRef.current.push(currentStrokeRef.current)
        socketRef.current.emit("stroke-complete", currentStrokeRef.current)
        drawGrid()
        redraw()
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
            <canvas className="absolute inset-0 w-full h-full"
             ref={canvasRef}
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseLeave={handleMouseUp}
             onMouseUp={handleMouseUp}
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
    </div>
  )
}

export default Board