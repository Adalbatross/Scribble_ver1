import { useRef, useState } from "react"
import { 
    drawStroke, 
    drawSelectionBox, 
    getStrokeAtPoint, 
    getHandleAtPoint, 
    getGroupBounds,
    isPointInGroupBounds
} from "../utils/canvasUtils"

export const useCanvasInteractions = (tool, color, brushSize, socketRef, drawGrid,spacePressRef, userIdRef) => {

    const canvasRef = useRef(null)
    const gridCanvasRef = useRef(null)
    const MIN_ZOOM = 0.1
    const MAX_ZOOM = 10
    const strokeRef = useRef([])
    const currentStrokeRef = useRef(null)
    const selectedStrokeRef = useRef(null)
    const activeHandleRef = useRef(null)
    const lastMouseRef = useRef({ x: 0, y: 0 })
    const hoveredHandleRef = useRef(null)
    const hoveredStrokeRef = useRef(null)
    const scaleRef = useRef(1)
    const offsetXRef = useRef(0)
    const offsetYRef = useRef(0)
    const isErasingRef = useRef(false)
    const dragStartPointsRef = useRef(null)
    const lastErasedRef = useRef(null)
    const selectedIdsRef = useRef([])
    const multiDragStartRef = useRef({})
    // const undoStackRef = useRef([])
    // const redoStackRef = useRef([])
    // const cloneStrokes = () => {
    //     return JSON.parse(JSON.stringify(strokeRef.current))
    // }
    // const undo  = () => {
    //     if(undoStackRef.current.length === 0) return

    //     const prevState = undoStackRef.current.pop()

    //     redoStackRef.current.push(cloneStrokes())

    //     strokeRef.current = prevState

    //     redraw()
    // }
    // const redo  = () => {
    //     if(redoStackRef.current.length === 0) return

    //     const nextState = redoStackRef.current.pop()

    //     undoStackRef.current.push(cloneStrokes())

    //     strokeRef.current = nextState

    //     redraw()
    // }

    const isPanningRef = useRef(false)
    const panStartRef = useRef({ x: 0, y: 0 })
    // const spacePressRef = useRef(false)

    const [isDrawing, setIsDrawing] = useState(false)
    const updateCursor = (handle) => {
        const canvas = canvasRef.current

        if (!canvas) return

        if (!handle) {
            canvas.style.cursor = tool === "select" ? "default" : "crosshair"
            return
        }

        if (handle === "tl" || handle === "br") {
            canvas.style.cursor = "nwse-resize"
        } else if (handle === "tr" || handle === "bl") {
            canvas.style.cursor = "nesw-resize"
        } else if (handle === "start" || handle === "end") {
            canvas.style.cursor = "pointer"
        } else if (handle === "center") {
            canvas.style.cursor = "move"
        } else {
            canvas.style.cursor = "crosshair"
    }
}

    // redraw function that redraws the canvas everytime

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
            drawStroke(ctx, stroke, scaleRef.current)
        })
        // if(selectedStrokeRef.current){
        //     drawSelectionBox(ctx, selectedStrokeRef.current, scaleRef.current)
        // }
        if (selectedIdsRef.current.length > 1) {
            const selectedStrokes = strokeRef.current.filter(s =>
                selectedIdsRef.current.includes(s.id)
            )

            const bounds = getGroupBounds(selectedStrokes)

            if (bounds) {
                const { minX, minY, maxX, maxY } = bounds
                const padding = 10 / scaleRef.current

                ctx.save()
                ctx.strokeStyle = "#3b82f6"
                ctx.lineWidth = 1.5 / scaleRef.current
                ctx.setLineDash([6 / scaleRef.current, 4 / scaleRef.current])

                ctx.strokeRect(
                    minX - padding,
                    minY - padding,
                    (maxX - minX) + padding * 2,
                    (maxY - minY) + padding * 2
                )

                ctx.setLineDash([])
                ctx.restore()
            }
        }
        selectedIdsRef.current.forEach((id)=>{
            const stroke = strokeRef.current.find(s=> s.id === id)
            if(stroke){
                drawSelectionBox(ctx, stroke, scaleRef.current)
            }
        })
        if(currentStrokeRef.current){
            drawStroke(ctx, currentStrokeRef.current, scaleRef.current)
        }
        ctx.restore()
        ctx.globalCompositeOperation = "source-over"
    }

    // handle mouse move hook

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
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext("2d");
        const x = (e.clientX - rect.left - offsetXRef.current) / scaleRef.current;
        const y = (e.clientY - rect.top - offsetYRef.current) / scaleRef.current;
        const stroke = currentStrokeRef.current
        if(tool === "eraser" && isErasingRef.current){
            const hitStroke = getStrokeAtPoint(
                x,
                y,
                strokeRef.current,
                scaleRef.current
            )
            if(hitStroke && lastErasedRef.current !== hitStroke.id){
                lastErasedRef.current = hitStroke.id

                strokeRef.current = strokeRef.current.filter(
                    s=>s.id !== hitStroke.id
                )
                socketRef.current.emit("stroke-delete", {
                    id: hitStroke.id
                })

                drawGrid()
                redraw()
            }
            return 
        }
        if(!isDrawing) {
            let hoveredHandle = null
            let hoveredStroke = null

            for(let i = strokeRef.current.length - 1; i>=0; i--){
                const s = strokeRef.current[i]
                const handle = getHandleAtPoint(x,y,s,scaleRef.current)

                if(handle){
                    hoveredHandle = handle
                    hoveredStroke = s
                    break
                }
            }
            hoveredHandleRef.current = hoveredHandle
            hoveredStrokeRef.current = hoveredStroke

            updateCursor(hoveredHandle)
        }
        if (tool === "select" && selectedStrokeRef.current && isDrawing && activeHandleRef.current) {
            
            const stroke = selectedStrokeRef.current
            const { corner, anchor } = activeHandleRef.current
            
            // 🟦 RECT (keep your existing logic)
            if (stroke.tool === "rect") {
                const p1 = stroke.points[0]
                const p2 = stroke.points[1]

                const newMinX = Math.min(anchor.x, x)
                const newMaxX = Math.max(anchor.x, x)
                const newMinY = Math.min(anchor.y, y)
                const newMaxY = Math.max(anchor.y, y)

                p1.x = newMinX
                p1.y = newMinY
                p2.x = newMaxX
                p2.y = newMaxY
            }

            // 🟩 LINE RESIZE
            if (stroke.tool === "line") {
                const p1 = stroke.points[0]
                const p2 = stroke.points[1]

                if (corner === "start") {
                    p1.x = x
                    p1.y = y
                }

                if (corner === "end") {
                    p2.x = x
                    p2.y = y
                }
            }

            // 🟣 CIRCLE RESIZE
            if (stroke.tool === "circle") {
                const center = stroke.points[0]
                const radiusPoint = stroke.points[1]

                // resize radius
                if (corner === "radius") {
                    radiusPoint.x = x
                    radiusPoint.y = y
                }

                // move center (VERY IMPORTANT)
                if (corner === "center") {
                    const dx = x - center.x
                    const dy = y - center.y

                    center.x = x
                    center.y = y

                    radiusPoint.x += dx
                    radiusPoint.y += dy
                }
            }

            redraw()   // 🚀 no need drawGrid
            return
        }
        
        if(tool === "select" && selectedStrokeRef.current && isDrawing && !activeHandleRef.current){

            // const stroke = selectedStrokeRef.current
            const startMouse = lastMouseRef.current
            const dx = x - startMouse.x
            const dy = y - startMouse.y

            // const originalPoints = dragStartPointsRef.current

            // stroke.points = originalPoints.map(p => ({
            //     x: p.x + dx,
            //     y: p.y + dy
            // }))
            selectedIdsRef.current.forEach((id)=>{
                const stroke = strokeRef.current.find(s=> s.id === id)
                const originalPoints = multiDragStartRef.current[id]

                if(stroke && originalPoints){
                    stroke.points = originalPoints.map(p => ({
                        x: p.x + dx, 
                        y: p.y + dy
                    }))
                }
            })

            // lastMouseRef.current = { x, y }

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

    // handle mouse down hook

    const handleMouseDown = (e) => {
        const isShiftPressed = e.shiftKey
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
        if(tool === "eraser"){
            isErasingRef.current = true

            const hitStroke = getStrokeAtPoint(
                x,
                y,
                strokeRef.current,
                scaleRef.current
            )
            if(hitStroke) {
                lastErasedRef.current = hitStroke.id

                strokeRef.current = strokeRef.current.filter(s=> s.id !== hitStroke.id)

                socketRef.current.emit("stroke-delete", {id: hitStroke.id})
                drawGrid()
                redraw()
            }
        }
        
        // PRIORITY: handle click (from hover)
        if (tool === "select") {
            //  GROUP BOX MOVE
            if (hoveredHandleRef.current && hoveredStrokeRef.current) {
                socketRef.current.emit("stroke-move-start")
                const stroke = hoveredStrokeRef.current
                const handle = hoveredHandleRef.current
                dragStartPointsRef.current = structuredClone(stroke.points)
                let anchor = null

                if (stroke.tool === "rect") {
                    const p1 = stroke.points[0]
                    const p2 = stroke.points[1]
                    
                    const minX = Math.min(p1.x, p2.x)
                    const maxX = Math.max(p1.x, p2.x)
                    const minY = Math.min(p1.y, p2.y)
                    const maxY = Math.max(p1.y, p2.y)

                    if (handle === "tl") anchor = { x: maxX, y: maxY }
                    if (handle === "tr") anchor = { x: minX, y: maxY }
                    if (handle === "bl") anchor = { x: maxX, y: minY }
                    if (handle === "br") anchor = { x: minX, y: minY }
                }

                selectedStrokeRef.current = stroke
                activeHandleRef.current = { corner: handle, anchor }
                setIsDrawing(true)
                return
            }
            if (selectedIdsRef.current.length > 1) {
                const selectedStrokes = strokeRef.current.filter(s =>
                    selectedIdsRef.current.includes(s.id)
                )

                const bounds = getGroupBounds(selectedStrokes)

                if (isPointInGroupBounds(x, y, bounds, scaleRef.current)) {
                    socketRef.current.emit("stroke-move-start")

                    multiDragStartRef.current = {}

                    selectedIdsRef.current.forEach((id) => {
                        const s = strokeRef.current.find(st => st.id === id)
                        if (s) {
                            multiDragStartRef.current[id] = structuredClone(s.points)
                        }
                    })

                    lastMouseRef.current = { x, y }
                    setIsDrawing(true)
                    drawGrid()
                    redraw()
                    return
                }
            }
            
            // ✅ fallback: normal selection
            const stroke = getStrokeAtPoint(x, y, strokeRef.current, scaleRef.current)

            if (stroke) {
                const alreadySelected = selectedIdsRef.current.includes(stroke.id)
                
                if (isShiftPressed) {
                    if (alreadySelected) {
                        selectedIdsRef.current = selectedIdsRef.current.filter(
                            id => id !== stroke.id
                        )
                    } else {
                        selectedIdsRef.current = [...selectedIdsRef.current, stroke.id]
                    }
                } else {
                    selectedIdsRef.current = [stroke.id]
                }
                
                multiDragStartRef.current = {}
                
                selectedIdsRef.current.forEach((id)=>{
                    const s = strokeRef.current.find(st=> st.id === id)
                    if(s){
                        multiDragStartRef.current[id] = structuredClone(s.points)
                    }
                })
                dragStartPointsRef.current = structuredClone(stroke.points)
                
                selectedStrokeRef.current = stroke
                lastMouseRef.current = { x, y }
                setIsDrawing(true)
                if(!isShiftPressed){
                    socketRef.current.emit("stroke-move-start")
                }
                drawGrid()
                redraw()
            } else {
                if (!isShiftPressed) {
                    selectedIdsRef.current = []
                    selectedStrokeRef.current = null
                    drawGrid()
                    redraw()
                }
            }

            return
        }
        currentStrokeRef.current = {
            id: crypto.randomUUID(),
            userId: userIdRef.current,
            tool,
            color,
            width: brushSize,
            points: [{x,y}]
        }
        if(tool === "rect" || tool === "line" || tool === "circle"){
            currentStrokeRef.current.points.push({x,y})
        }
        setIsDrawing(true)

        console.log("Mouse Down at:",x,y)
    }

    // handle mouse up hook

    const handleMouseUp = () => {
        if(isPanningRef.current){
            isPanningRef.current = false
            return 
        }
        if(tool === "select"){
            if(selectedIdsRef.current.length > 0){
                const movedStrokes = strokeRef.current.filter(s => 
                    selectedIdsRef.current.includes(s.id)
                )
                socketRef.current.emit("strokes-move", 
                    movedStrokes
                )
                // selectedStrokeRef.current = null
            }
            activeHandleRef.current = null
            dragStartPointsRef.current = null
            multiDragStartRef.current = {}
            setIsDrawing(false)
            drawGrid()
            redraw()

            return
        }
        if(tool === "eraser"){
            isErasingRef.current = false
            lastErasedRef.current = null
        }
        if(!currentStrokeRef.current) return

        // undoStackRef.current.push(cloneStrokes())
        // redoStackRef.current = []

        strokeRef.current.push(currentStrokeRef.current)
        socketRef.current.emit("stroke-complete", currentStrokeRef.current)
        drawGrid()
        redraw()
        const ctx = canvasRef.current.getContext("2d")
        ctx.globalCompositeOperation = "source-over"
        currentStrokeRef.current = null
        setIsDrawing(false)
    }
    return {
        canvasRef,
        gridCanvasRef,
        redraw,
        strokeRef,
        scaleRef,
        // undo,
        // redo,
        offsetXRef,
        offsetYRef,
        handlers: {
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
            onMouseLeave: handleMouseUp,
        }
    }
}