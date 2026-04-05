import { useEffect, useRef, useState } from "react"
import { 
    drawStroke, 
    drawSelectionBox, 
    getStrokeAtPoint, 
    getHandleAtPoint, 
    getGroupBounds,
    isPointInGroupBounds,
    isStrokeInBounds
} from "../utils/canvasUtils"

export const useCanvasInteractions = (tool, color, brushSize, socketRef, drawGrid,spacePressRef, userIdRef,notifySelectionChange 
    // isEditingRef
) => {

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
    const textResizeStartRef = useRef(null)
    const selectedIdsRef = useRef([])
    const multiDragStartRef = useRef({})
    const marqueeStartRef = useRef(null)
    const marqueeCurrentRef = useRef(null)
    const isMarqueeSelectingRef = useRef(false)
    const didMoveSelectionRef= useRef(false)
    const clipboardRef = useRef([])
    const groupFlashRef = useRef(false)
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
    const triggerGroupFlash = () => {
        let flashCount = 0
        const interval = setInterval(() => {
            groupFlashRef.current = !groupFlashRef.current
            redraw()

            flashCount++
            if (flashCount > 3) {
                clearInterval(interval)
                groupFlashRef.current = false
                redraw()
            }
        }, 80)// 🔥 duration of blink (adjust if needed)
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
            const isHovered = hoveredStrokeRef.current?.id === stroke.id

            if (isHovered) {
                ctx.save()
                ctx.globalAlpha = 0.8
            }

            drawStroke(ctx, stroke, scaleRef.current)

            if (isHovered) {
                ctx.restore()
            }
        })
        // if(selectedStrokeRef.current){
        //     drawSelectionBox(ctx, selectedStrokeRef.current, scaleRef.current)
        // }
// ✅ Multi selection → show BOTH outer box + inner boxes
        if (selectedIdsRef.current.length > 1) {
            const selectedStrokes = strokeRef.current.filter(s =>
                selectedIdsRef.current.includes(s.id)
            )

            // 1️⃣ Draw inner selection boxes for each selected stroke
            selectedStrokes.forEach((stroke) => {
                drawSelectionBox(ctx, stroke, scaleRef.current)
            })

            // 2️⃣ Draw outer combined bounding box
            const bounds = getGroupBounds(selectedStrokes)

            if (bounds) {
                const { minX, minY, maxX, maxY } = bounds
                const padding = 10 / scaleRef.current

                ctx.save()
                ctx.strokeStyle = groupFlashRef.current ? "#22c55e" : "#3b82f6"
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

        // ✅ Single selection → normal individual selection box
        else if (selectedIdsRef.current.length === 1) {
            const stroke = strokeRef.current.find(
                s => s.id === selectedIdsRef.current[0]
            )

            if (stroke) {
                drawSelectionBox(ctx, stroke, scaleRef.current)
            }
        }
        if(currentStrokeRef.current){
            drawStroke(ctx, currentStrokeRef.current, scaleRef.current)
        }
        if (isMarqueeSelectingRef.current && marqueeStartRef.current && marqueeCurrentRef.current) {
            const start = marqueeStartRef.current
            const current = marqueeCurrentRef.current

            const minX = Math.min(start.x, current.x)
            const minY = Math.min(start.y, current.y)
            const width = Math.abs(start.x - current.x)
            const height = Math.abs(start.y - current.y)

            ctx.save()

            // hard reset all drawing state for marquee
            ctx.globalCompositeOperation = "source-over"
            ctx.globalAlpha = 1
            ctx.strokeStyle = "#3b82f6"
            ctx.fillStyle = "rgba(59, 130, 246, 0.08)"
            ctx.lineWidth = 1.5 / scaleRef.current
            ctx.setLineDash([6 / scaleRef.current, 4 / scaleRef.current])
            ctx.lineCap = "butt"
            ctx.lineJoin = "miter"

            ctx.fillRect(minX, minY, width, height)
            ctx.strokeRect(minX, minY, width, height)

            ctx.setLineDash([])
            ctx.restore()
        }
        ctx.restore()
        ctx.globalCompositeOperation = "source-over"
        ctx.globalAlpha = 1
        ctx.setLineDash([])
    }

    const getGroupedSelectionIds = (stroke) => {
        if(!stroke) return []
        
        if(!stroke.groupId) return [stroke.id]
        
        return strokeRef.current
        .filter(s=>s.groupId === stroke.groupId)
        .map(s=>s.id)
    }
    
    const groupSelectedStrokes = () => {
        if(selectedIdsRef.current.length < 2 ) return 
        
        const newGroupId = crypto.randomUUID()
        
        socketRef.current.emit("stroke-move-start")
        
        strokeRef.current = strokeRef.current.map(stroke => {
            if (selectedIdsRef.current.includes(stroke.id)) {
                return {
                    ...stroke,
                    groupId: newGroupId
                }
            }
            return stroke
        })
        const updatedStrokes = strokeRef.current.filter(stroke => 
            selectedIdsRef.current.includes(stroke.id)
        )
        
        socketRef.current.emit("strokes-move", updatedStrokes)
        
        drawGrid()
        triggerGroupFlash()
        redraw()
        notifySelectionChange()
    }
    const ungroupSelectedStrokes = () => {
        if (selectedIdsRef.current.length === 0) return 

        const selectedStrokes = strokeRef.current.filter(stroke => 
            selectedIdsRef.current.includes(stroke.id)
        )
        const hasAnyGroup = selectedStrokes.some(stroke => stroke.groupId)

        if(!hasAnyGroup) return

        socketRef.current.emit("stroke-move-start")

        strokeRef.current = strokeRef.current.map(stroke => {
            if (selectedIdsRef.current.includes(stroke.id)) {
                return {
                    ...stroke,
                    groupId: null
                }
            }
            return stroke
        })

        const updatedStrokes = strokeRef.current.filter(stroke => 
            selectedIdsRef.current.includes(stroke.id)      
        )

        socketRef.current.emit("strokes-move", updatedStrokes)

        drawGrid()
        triggerGroupFlash()
        redraw()
        notifySelectionChange()
    }
    // handle mouse move hook
    const handleMouseMove = (e) => {
        // if (isEditingRef?.current) return
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
        if (!isDrawing && tool === "select") {
            let hoveredHandle = null
            let hoveredStroke = null

            // 1️⃣ Check handles first (highest priority)
            for (let i = strokeRef.current.length - 1; i >= 0; i--) {
                const s = strokeRef.current[i]
                const handle = getHandleAtPoint(x, y, s, scaleRef.current)

                if (handle) {
                    hoveredHandle = handle
                    hoveredStroke = s
                    break
                }
            }

            // 2️⃣ If no handle → check stroke hover
            if (!hoveredHandle) {
                hoveredStroke = getStrokeAtPoint(
                    x,
                    y,
                    strokeRef.current,
                    scaleRef.current
                )
            }

            hoveredHandleRef.current = hoveredHandle
            hoveredStrokeRef.current = hoveredStroke

            if (selectedIdsRef.current.length > 1) {
                const selectedStrokes = strokeRef.current.filter(s =>
                    selectedIdsRef.current.includes(s.id)
                )

                const bounds = getGroupBounds(selectedStrokes)

                if (isPointInGroupBounds(x, y, bounds, scaleRef.current)) {
                    canvasRef.current.style.cursor = "move"
                    return
                }
            }

            // 3️⃣ Decide cursor
            if (hoveredHandle) {
                updateCursor(hoveredHandle)
            } 
            else if (hoveredStroke) {
                if (selectedIdsRef.current.includes(hoveredStroke.id)) {
                    canvasRef.current.style.cursor = "move"
                } else {
                    canvasRef.current.style.cursor = "pointer"
                }
            } 
            else {
                canvasRef.current.style.cursor = "default"
            }
        }
        if(tool === 'select' && isMarqueeSelectingRef.current){
            marqueeCurrentRef.current = {x, y}
            drawGrid()
            redraw()
            return 
        }
        if (tool === "select" && selectedStrokeRef.current && isDrawing && activeHandleRef.current) {
            
            didMoveSelectionRef.current = true
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
            if (stroke.tool === "line" || stroke.tool === "arrow") {
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
            if (stroke.tool === "text") {
                if (!textResizeStartRef.current) return

                const { startX, startWidth } = textResizeStartRef.current
                const dx = x - startX

                const sensitivity = 0.03
                const newWidth = Math.max(2, startWidth + dx * sensitivity)

                stroke.width = newWidth
            }

            redraw()   // 🚀 no need drawGrid
            return
        }
        
        if(tool === "select" && selectedIdsRef.current.length > 0 && isDrawing && !activeHandleRef.current){

            didMoveSelectionRef.current = true

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
        if(stroke.tool === "rect" || stroke.tool === "line" || stroke.tool === "circle" || stroke.tool === "arrow"){
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
        // if(isEditingRef?.current) return
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
        didMoveSelectionRef.current = false
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
                textResizeStartRef.current = null

                if (stroke.tool === "text" && handle === "br") {
                    textResizeStartRef.current = {
                        startX: x,
                        startWidth: stroke.width
                    }
                }
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

            const clickedStroke = getStrokeAtPoint(
                x,
                y,
                strokeRef.current,
                scaleRef.current
            )

            const clickedSelectedStroke =
                clickedStroke && selectedIdsRef.current.includes(clickedStroke.id)

            // const clickedUnselectedStroke =
            //     clickedStroke && !selectedIdsRef.current.includes(clickedStroke.id)

            const clickedEmptyInsideGroupBox =
                !clickedStroke &&
                bounds &&
                isPointInGroupBounds(x, y, bounds, scaleRef.current)

            // ✅ allow drag if:
            // - clicked selected item
            // - OR clicked empty area inside outer group box
            // ❌ do NOT drag if clicked unselected item
            if (!isShiftPressed && (clickedSelectedStroke || clickedEmptyInsideGroupBox)) {
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

            // if clicked unselected stroke, let fallback selection logic handle it
        }
            
            // ✅ fallback: normal selection
            const stroke = getStrokeAtPoint(x, y, strokeRef.current, scaleRef.current)

            if (stroke) {
                const groupIds = getGroupedSelectionIds(stroke)
                const groupSet = new Set(groupIds)

                if (isShiftPressed) {
                    const allAlreadySelected = groupIds.every(id =>
                        selectedIdsRef.current.includes(id)
                    )

                    if (allAlreadySelected) {
                        // ✅ shift-click selected item/group → remove from selection
                        selectedIdsRef.current = selectedIdsRef.current.filter(
                            id => !groupSet.has(id)
                        )
                    } else {
                        // ✅ shift-click unselected item/group → add to selection
                        const merged = new Set([...selectedIdsRef.current, ...groupIds])
                        selectedIdsRef.current = [...merged]
                    }
                } else {
                    // normal click = replace selection
                    selectedIdsRef.current = groupIds
                }
                // sync single-selection ref
                if (selectedIdsRef.current.length === 1) {
                    selectedStrokeRef.current =
                        strokeRef.current.find(s => s.id === selectedIdsRef.current[0]) || null
                } else {
                    selectedStrokeRef.current = null
                }

                // prepare drag state, but don't force weird selection behavior
                multiDragStartRef.current = {}

                selectedIdsRef.current.forEach((id) => {
                    const s = strokeRef.current.find(st => st.id === id)
                    if (s) {
                        multiDragStartRef.current[id] = structuredClone(s.points)
                    }
                })

                // ✅ only allow drag on normal click, NOT shift-click
                if (!isShiftPressed) {
                    lastMouseRef.current = { x, y }
                    setIsDrawing(true)
                    socketRef.current.emit("stroke-move-start")
                } else {
                    setIsDrawing(false)
                }

                drawGrid()
                redraw()
                notifySelectionChange()
            } else {
                // ✅ click on empty canvas → clear selection + start marquee
                if (!isShiftPressed) {
                    selectedIdsRef.current = []
                    selectedStrokeRef.current = null

                    marqueeStartRef.current = { x, y }
                    marqueeCurrentRef.current = { x, y }
                    isMarqueeSelectingRef.current = true

                    drawGrid()
                    redraw()
                    notifySelectionChange?.()
                }
            }

            return
        }
        if (tool === "text") {
            const textStroke = {
                id: crypto.randomUUID(),
                userId: userIdRef.current,
                tool: "text",
                color,
                width: brushSize,
                text: "",
                groupId: null,
                points: [{ x, y }]
            }

            strokeRef.current.push(textStroke)
            socketRef.current.emit("stroke-complete", textStroke)

            selectedIdsRef.current = [textStroke.id]
            selectedStrokeRef.current = textStroke

            drawGrid()
            redraw()
            notifySelectionChange?.()

            window.dispatchEvent(
                new CustomEvent("open-text-editor", {
                    detail: textStroke
                })
            )
            return
        }
        currentStrokeRef.current = {
            id: crypto.randomUUID(),
            userId: userIdRef.current,
            tool,
            color,
            width: brushSize,
            groupId: null,
            points: [{x,y}]
        }
        if(tool === "rect" || tool === "line" || tool === "circle" || tool === "arrow"){
            currentStrokeRef.current.points.push({x,y})
        }
        setIsDrawing(true)
        
        console.log("Mouse Down at:",x,y)
    }
    
    // handle mouse up hook

    const handleMouseUp = () => {
        // if (isEditingRef?.current) return 
        if(isPanningRef.current){
            isPanningRef.current = false
            return 
        }
        if(tool === "select"){
            if(isMarqueeSelectingRef.current){
                const start = marqueeStartRef.current
                const end = marqueeCurrentRef.current

                const bounds = {
                    minX: Math.min(start.x, end.x),
                    maxX: Math.max(start.x, end.x),
                    minY: Math.min(start.y, end.y),
                    maxY: Math.max(start.y, end.y),
                }

                const selected = strokeRef.current
                    .filter(stroke => isStrokeInBounds(stroke, bounds))

                const expandedIds = new Set()

                selected.forEach((stroke) => {
                    getGroupedSelectionIds(stroke).forEach(id => expandedIds.add(id))
                })

                selectedIdsRef.current = [...expandedIds]

                if (selected.length === 1) {
                    selectedStrokeRef.current = selected[0]
                }
                else{
                    selectedStrokeRef.current = null
                }

                isMarqueeSelectingRef.current = false
                marqueeCurrentRef.current= null
                marqueeStartRef.current= null
                textResizeStartRef.current = null

                drawGrid()
                redraw()
                notifySelectionChange?.()
                return 
            }
            if(didMoveSelectionRef.current && selectedIdsRef.current.length > 0){
                const movedStrokes = strokeRef.current.filter(s => 
                    selectedIdsRef.current.includes(s.id)
                )
                socketRef.current.emit("strokes-move", 
                    movedStrokes
                )
                // selectedStrokeRef.current = null
            }
            didMoveSelectionRef.current = false
            activeHandleRef.current = null
            dragStartPointsRef.current = null
            multiDragStartRef.current = {}
            textResizeStartRef.current = null
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
    const duplicateSelectedStrokes = () => {
        if (selectedIdsRef.current.length === 0) return

        const OFFSET = 20

        const selectedStrokes = strokeRef.current.filter(stroke =>
            selectedIdsRef.current.includes(stroke.id)
        )
        const oldToNewGroupMap = {}

        const duplicated = selectedStrokes.map(stroke => {
            let newGroupId = null

            if (stroke.groupId) {
                if (!oldToNewGroupMap[stroke.groupId]) {
                    oldToNewGroupMap[stroke.groupId] = crypto.randomUUID()
                }
                newGroupId = oldToNewGroupMap[stroke.groupId]
            }

            return {
                ...structuredClone(stroke),
                id: crypto.randomUUID(),
                groupId: newGroupId,
                points: stroke.points.map(p => ({
                    x: p.x + OFFSET,
                    y: p.y + OFFSET
                }))
            }
        })

        
        strokeRef.current.push(...duplicated)
        const expandedIds = new Set()
        duplicated.forEach(stroke => {
            getGroupedSelectionIds(stroke).forEach(id => expandedIds.add(id))
        })
        selectedIdsRef.current = [...expandedIds]
        selectedStrokeRef.current = duplicated.length === 1 ? duplicated[0] : null
        socketRef.current.emit("strokes-add-bulk", duplicated)


        drawGrid()
        redraw()
        notifySelectionChange?.()
    }
    const copySelectedStrokes = () => {
        if(selectedIdsRef.current.length === 0) return 

        const selectedStrokes = strokeRef.current.filter(stroke=>
            selectedIdsRef.current.includes(stroke.id)
        )

        clipboardRef.current = structuredClone(selectedStrokes)
    }
    const pasteClipboardStrokes = () => {
        if (!clipboardRef.current || clipboardRef.current.length === 0) return

        const OFFSET = 20
        const oldToNewGroupMap = {}

        const pasted = clipboardRef.current.map(stroke => {
            let newGroupId = null

            if (stroke.groupId) {
                if (!oldToNewGroupMap[stroke.groupId]) {
                    oldToNewGroupMap[stroke.groupId] = crypto.randomUUID()
                }
                newGroupId = oldToNewGroupMap[stroke.groupId]
            }

            return {
                ...structuredClone(stroke),
                id: crypto.randomUUID(),
                groupId: newGroupId,
                points: stroke.points.map(p => ({
                    x: p.x + OFFSET,
                    y: p.y + OFFSET
                }))
            }
        })

        strokeRef.current.push(...pasted)

        const expandedIds = new Set()
        pasted.forEach(stroke => {
            getGroupedSelectionIds(stroke).forEach(id => expandedIds.add(id))
        })
        selectedIdsRef.current = [...expandedIds]
        selectedStrokeRef.current = pasted.length === 1 ? pasted[0] : null

        clipboardRef.current = structuredClone(pasted)

        socketRef.current.emit("strokes-add-bulk", pasted)


        drawGrid()
        redraw()
        notifySelectionChange?.()
    }
    const bringForward = () => {
        if (selectedIdsRef.current.length === 0) return

        const strokes = [...strokeRef.current]
        const selectedSet = new Set(selectedIdsRef.current)

        for (let i = strokes.length - 2; i >= 0; i--) {
            if (selectedSet.has(strokes[i].id) && !selectedSet.has(strokes[i + 1].id)) {
                ;[strokes[i], strokes[i + 1]] = [strokes[i + 1], strokes[i]]
            }
        }

        strokeRef.current = strokes
        socketRef.current.emit("strokes-reorder", strokeRef.current)

        drawGrid()
        redraw()
    }

    const sendBackward = () => {
        if (selectedIdsRef.current.length === 0) return

        const strokes = [...strokeRef.current]
        const selectedSet = new Set(selectedIdsRef.current)

        for (let i = 1; i < strokes.length; i++) {
            if (selectedSet.has(strokes[i].id) && !selectedSet.has(strokes[i - 1].id)) {
                ;[strokes[i], strokes[i - 1]] = [strokes[i - 1], strokes[i]]
            }
        }

        strokeRef.current = strokes
        socketRef.current.emit("strokes-reorder", strokeRef.current)

        drawGrid()
        redraw()
    }
    const getSelectionGroupState = () => {
        const selectedStrokes = strokeRef.current.filter(stroke =>
            selectedIdsRef.current.includes(stroke.id)
        )

        const selectedGroupIds = selectedStrokes
            .map(stroke => stroke.groupId)
            .filter(Boolean)

        const uniqueGroupIds = [...new Set(selectedGroupIds)]

        const allGroupedTogether =
            selectedStrokes.length > 1 &&
            uniqueGroupIds.length === 1 &&
            selectedStrokes.every(stroke => stroke.groupId === uniqueGroupIds[0])

        const canGroup = selectedStrokes.length > 1 && !allGroupedTogether
        const canUngroup = selectedStrokes.some(stroke => stroke.groupId)

        return {
            canGroup,
            canUngroup
        }
    }
    useEffect(() => {
        const handleDeleteSelected = () => {
            if (selectedIdsRef.current.length === 0) return

            strokeRef.current = strokeRef.current.filter(
                stroke => !selectedIdsRef.current.includes(stroke.id)
            )

            socketRef.current.emit("delete-selected", selectedIdsRef.current)

            selectedIdsRef.current = []
            selectedStrokeRef.current = null

            drawGrid()
            redraw()
            notifySelectionChange?.()
        }
        const handleCopySelected = () => {
            copySelectedStrokes()
        }

        const handlePasteSelected = () => {
            pasteClipboardStrokes()
        }
        const handleDuplicateSelected = () =>{
            duplicateSelectedStrokes()
        }
        const handleGroupSelected = () => {
            groupSelectedStrokes()
        }
        const handleUnGroupSelected = () => {
            ungroupSelectedStrokes()
        }
        window.addEventListener("duplicate-selected", handleDuplicateSelected)
        window.addEventListener("delete-selected", handleDeleteSelected)
        window.addEventListener("copy-selected", handleCopySelected)
        window.addEventListener("paste-selected", handlePasteSelected)
        window.addEventListener("group-selected", handleGroupSelected)
        window.addEventListener("ungroup-selected", handleUnGroupSelected)
        
        return () => {
            window.removeEventListener("delete-selected", handleDeleteSelected)
            window.removeEventListener("duplicate-selected", handleDuplicateSelected)
            window.removeEventListener("copy-selected", handleCopySelected)
            window.removeEventListener("paste-selected", handlePasteSelected)
            window.removeEventListener("group-selected", handleGroupSelected)
            window.removeEventListener("ungroup-selected", handleUnGroupSelected)
            
        }

    }, [])
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
        bringForward,
        sendBackward,
        groupSelectedStrokes,
        ungroupSelectedStrokes,
        getSelectionGroupState,
        handlers: {
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
            onMouseLeave: handleMouseUp,
        }
    }
}