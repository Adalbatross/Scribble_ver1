import React from 'react'
import {io} from "socket.io-client"
import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Toolbar from '../components/Toolbar'
import { useCanvasInteractions } from '../hooks/useCanvasInteracions'
import ToolOptionsPanel from '../components/ToolOptionsPanel'
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf"
const Board = () => {
    const MIN_ZOOM = 0.1
    const MAX_ZOOM = 10
    const baseGridSize = 50
    const {id} = useParams()
    console.log(`Boards's ID : ${id}`)
    const socketRef = useRef(null)
    const spacePressRef = useRef(false)
    const userIdRef = useRef(null)
    const lastThumbnailRef = useRef(null)
    const [tool, setTool] = useState("select")
    const [color, setColor] = useState("black")
    const [brushSize, setBrushSize] = useState(5)
    const [textInput, setTextInput] = useState(null)
    const editorRef= useRef(null)
    const isEditingRef = useRef(false)
    const location = useLocation();
    const dropdownRef = useRef(null)
    const [users, setUsers] = useState([])
    const [showMembers, setShowMembers] = useState(false)
    const [, setSelectionVersion] = useState(0)
    const [isToolLocked, setisToolLocked] = useState(false)
    const [strokeStyle, setStrokeStyle] = useState("solid")
    const [fillColor, setFillColor] = useState(null)
    const [strokeOpacity, setStrokeOpacity] = useState(1)
    const [showMenu, setShowMenu] = useState(false)
    const [boardTitle, setBoardTitle] = useState("")
    const [showShareModal, setShowShareModal] = useState(false)
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("dark-mode") === "true"
    })
    const [showGrid, setShowGrid] = useState(() => {
        const saved = localStorage.getItem("show-grid")
        return saved === null ? true : saved === "true"
    })
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
    const generateThumbnail = () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d");

        // small preview size
        tempCanvas.width = 300;
        tempCanvas.height = 200;
        
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
        
        return tempCanvas.toDataURL("image/jpeg", 0.7);
    };
    const showGridRef = useRef(showGrid)
    const saveThumbnail = async () => {
        try {
            const thumbnail = lastThumbnailRef.current;

            if (!thumbnail) {
            console.log("NO THUMBNAIL AVAILABLE");
            return;
            }

            await fetch(`http://localhost:5000/api/boards/${id}/thumbnail`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ thumbnail }),
            });

            console.log("Thumbnail saved via fetch");
        } catch (err) {
            console.error("Thumbnail error:", err);
        }
    };
    // const handleCopy = async () => {
    // const url = `${window.location.origin}/board/${id}`

    // await navigator.clipboard.writeText(url)
    // setCopied(true)
    // setTimeout(() => setCopied(false), 1500)
    // }
    
    function drawGrid() {
        const canvas = gridCanvasRef?.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")

        // always clear first
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // if grid OFF → just clear and stop
        if (!showGridRef.current) {
            const canvas = gridCanvasRef?.current
            if (!canvas) return
            const ctx = canvas.getContext("2d")
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            return
        }

        const width = canvas.width
        const height = canvas.height

        const scale = scaleRef.current
        const offsetX = offsetXRef.current
        const offsetY = offsetYRef.current

        let gridSize = baseGridSize

        if (gridSize * scale < 8) gridSize *= 2
        if (scale < 0.5) gridSize *= 4
        else if (scale < 1) gridSize *= 2
        else if (scale > 2) gridSize /= 2

        ctx.save()
        ctx.translate(offsetX, offsetY)
        ctx.scale(scale, scale)

        const startX = -offsetX / scale
        const startY = -offsetY / scale
        const endX = startX + width / scale
        const endY = startY + height / scale

        const firstX = Math.floor(startX / gridSize) * gridSize
        const firstY = Math.floor(startY / gridSize) * gridSize

        for (let x = firstX; x < endX; x += gridSize) {
            ctx.beginPath()
            ctx.strokeStyle = (Math.round(x / gridSize) % 10 === 0)
                ? (darkMode ? "#444" : "#cfcfcf")
                : (darkMode ? "#2a2a2a" : "#e8e8e8")

            ctx.lineWidth = (Math.round(x / gridSize) % 10 === 0) ? 1.5 : 1

            ctx.moveTo(Math.round(x) + 0.5, startY)
            ctx.lineTo(Math.round(x) + 0.5, endY)
            ctx.stroke()
        }

        for (let y = firstY; y < endY; y += gridSize) {
            ctx.beginPath()
            ctx.strokeStyle = (Math.round(y / gridSize) % 10 === 0)
                ? (darkMode ? "#444" : "#cfcfcf")
                : (darkMode ? "#2a2a2a" : "#e8e8e8")

            ctx.lineWidth = (Math.round(y / gridSize) % 10 === 0) ? 1.5 : 1

            ctx.moveTo(startX, Math.round(y) + 0.5)
            ctx.lineTo(endX, Math.round(y) + 0.5)
            ctx.stroke()
        }

        ctx.restore()
    }
    const {canvasRef , gridCanvasRef,redraw, strokeRef,scaleRef, offsetXRef
        ,getSelectionGroupState, offsetYRef, handlers,bringForward, sendBackward,
        groupSelectedStrokes, ungroupSelectedStrokes,updateRemoteCursor, removeRemoteCursor
        
    } = useCanvasInteractions(
        tool,
        setTool,
        isToolLocked,
        color,
        brushSize,
        strokeStyle,
        fillColor,
        strokeOpacity,
        socketRef,
        drawGrid,
        darkMode,
        spacePressRef,
        id,
        userIdRef,
        ()=> setSelectionVersion(v=>v+1)
    )
    const {canGroup, canUngroup} = getSelectionGroupState()
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
        const user = JSON.parse(localStorage.getItem("user"))
        socketRef.current.emit("join-room", {
            roomId: id,
            userId: userIdRef.current,
            username: user?.username || "Guest"
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
        
        socketRef.current.on("cursor-update", ({x, y, socketId, username})=>{
            updateRemoteCursor(socketId, x,y,username)
        })
        socketRef.current.on("strokes-add-bulk", (newStrokes) => {
            strokeRef.current.push(...newStrokes)
            drawGrid()
            redraw()
        })
        socketRef.current.on("user-disconnected", (socketId) => {
            removeRemoteCursor(socketId)
            redraw()
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
            setSelectionVersion(v=>v+1)
        })
        socketRef.current.on("strokes-reordered", (updatedStroke)=>{
            strokeRef.current = updatedStroke
            drawGrid()
            redraw()
        })

        socketRef.current.on("delete-selected", (ids) => {
            strokeRef.current = strokeRef.current.filter(
                stroke => !ids.includes(stroke.id)
            )

            drawGrid()
            redraw()
            setSelectionVersion(v=>v+1)
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
            if(isEditingRef.current) return 
            if(e.code === "Space"){
                spacePressRef.current = true
                canvasRef.current.style.cursor = "grab"
            }
            const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z"
            const isRedo = (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "Z"))

            if (isUndo) {
                e.preventDefault()
                socketRef.current.emit("undo")
            }

            if (isRedo) {
                e.preventDefault()
                socketRef.current.emit("redo")
            }    
            const isDelete  = e.key === "Delete" || e.key === "Backspace"
            if(isDelete) {
                window.dispatchEvent(new CustomEvent("delete-selected"))
            }  
            const isDuplicate = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d"   
            if(isDuplicate){
                e.preventDefault()
                window.dispatchEvent(new CustomEvent("duplicate-selected"))
            }
            const isCopy = (e.ctrlKey || e.metaKey) && e.key === "c"
            const isPaste = (e.ctrlKey || e.metaKey) && e.key === "v"

            if (isCopy) {
                e.preventDefault()
                window.dispatchEvent(new CustomEvent("copy-selected"))
            }

            if (isPaste) {
                e.preventDefault()
                window.dispatchEvent(new CustomEvent("paste-selected"))
            }
            const isBringFront = (e.ctrlKey || e.metaKey) && e.key === "]"
            const isSendToBack = (e.ctrlKey || e.metaKey) && e.key === "["

            if(isBringFront){
                e.preventDefault()
                bringForward()
            }
            if(isSendToBack){
                e.preventDefault()
                sendBackward()
            }

            const isGroup = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "g"
            const isUnGroup = (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "g"
            if(isGroup){
                e.preventDefault()
                window.dispatchEvent(new CustomEvent("group-selected"))
            }
            if(isUnGroup){
                e.preventDefault()
                window.dispatchEvent(new CustomEvent("ungroup-selected"))
            }
        }
        const handleKeyUp = (e)=>{
            if(isEditingRef.current) return
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
    useEffect(()=>{
        isEditingRef.current = !!textInput
    }, [textInput])
    useEffect(() => {
        const interval = setInterval(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const tempCanvas = document.createElement("canvas");
            const ctx = tempCanvas.getContext("2d");

            tempCanvas.width = 300;
            tempCanvas.height = 200;

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, 300, 200);

            ctx.drawImage(canvas, 0, 0, 300, 200);

            lastThumbnailRef.current = tempCanvas.toDataURL("image/jpeg", 0.6);

            console.log("Thumbnail cached");
        }, 2000); // every 2 sec

        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        if (textInput && editorRef.current) {
            requestAnimationFrame(() => {
                if (editorRef.current) {
                    editorRef.current.focus()
                    editorRef.current.select()
                }
            })
        }
    }, [textInput?.id])
    useEffect(() => {
        return () => {
            console.log("LEAVING BOARD → saving thumbnail");
            saveThumbnail();
        };
    }, [location.pathname]);
    useEffect(() => {
        const handleOpenTextEditor = (e) => {
            const stroke = e.detail
            if (!stroke || stroke.tool !== "text") return

            setTextInput({
                id: stroke.id,
                x: stroke.points[0].x,
                y: stroke.points[0].y,
                value: stroke.text || "",
                color: stroke.color,
                fontSize: stroke.width * 4
            })
        }

        window.addEventListener("open-text-editor", handleOpenTextEditor)

        return () => {
            window.removeEventListener("open-text-editor", handleOpenTextEditor)
        }
    }, [])
    // useEffect(() => {
    //     return () => {
    //         saveThumbnail();
    //     };
    // }, []);
    useEffect(() => {
        const handleBeforeUnload = () => {
            const thumbnail = generateThumbnail();

            if (!thumbnail) return;

            const blob = new Blob([JSON.stringify({ thumbnail })], {
            type: "application/json",
            });

            navigator.sendBeacon(`http://localhost:5000/api/boards/${id}/thumbnail`, blob);
            };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [id]);
    useEffect(() => {
    fetch(`http://localhost:5000/api/boards/${id}`)
        .then(res => res.json())
        .then(data => {
        setBoardTitle(data.title)
        })
    }, [id])
    const saveTextEdit = () => {
        console.log("SAVE THUMBNAIL CALLED");
        if (!textInput) return

        const index = strokeRef.current.findIndex(s => s.id === textInput.id)

        if (index === -1) {
            setTextInput(null)
            return
        }

        const trimmed = textInput.value?.trim() || ""

        if (!trimmed) {
            const deletedId = textInput.id

            strokeRef.current = strokeRef.current.filter(s => s.id !== deletedId)

            socketRef.current.emit("stroke-delete", { id: deletedId })
            drawGrid()
            redraw()
            setTextInput(null)
            return
        }

        const updatedStroke = {
            ...strokeRef.current[index],
            text: trimmed
        }

        strokeRef.current[index] = updatedStroke

        socketRef.current.emit("stroke-move", updatedStroke)
        drawGrid()
        redraw()
        setTextInput(null)
        if (!isToolLocked){
            setTool("select")
        }
    }
    useEffect(() => {
        if (!textInput) return

        // when tool changes while editing → save
        return () => {
            saveTextEdit()
        }
    }, [tool])

    useEffect(() => {
        window.__editingTextId = textInput?.id || null
        drawGrid()
        redraw()
    }, [textInput])
    useEffect(() => {
        showGridRef.current = showGrid
    }, [showGrid])
    const editorLines = (textInput?.value || "").split("\n")
    const scaledFontSize = (textInput?.fontSize || 16) * scaleRef.current
    const editorLineHeight = scaledFontSize * 1.2
    const editorWidth = Math.max(
        60,
        ...editorLines.map(line => Math.max(1, line.length) * scaledFontSize * 0.6)
    )
    const editorHeight = Math.max(
        editorLineHeight,
        editorLines.length * editorLineHeight
    )
    useEffect(() => {
        drawGrid()
        redraw()
    }, [showGrid])
    useEffect(() => {
        drawGrid()
        redraw()
    }, [darkMode])

    const handleExportPNG = () => {
        const canvas = canvasRef.current

        if (!canvas) {
            console.error("Canvas not found")
            return
        }

        
        const scale = 2 

        const exportCanvas = document.createElement("canvas")
        exportCanvas.width = canvas.width * scale
        exportCanvas.height = canvas.height * scale

        const ctx = exportCanvas.getContext("2d")

        
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)

        ctx.scale(scale, scale)
        ctx.drawImage(canvas, 0, 0)

        const link = document.createElement("a")
        link.download = `board-${Date.now()}.png`
        link.href = exportCanvas.toDataURL("image/png")

        link.click()
    }
    const handleExportPDF = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const imgData = canvas.toDataURL("image/png")

        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: [canvas.width, canvas.height]
        })

        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height)

        pdf.save(`board-${Date.now()}.pdf`)
    }
    useEffect(() => {
        const handleClick = (e) => {
            if (!dropdownRef.current) return

            if (!dropdownRef.current.contains(e.target)) {
                setShowMembers(false)
            }
        }

        window.addEventListener("click", handleClick)
        return () => window.removeEventListener("click", handleClick)
    }, [])
    const shareLink = `${window.location.origin}/board/${id}`
    const menuRef = useRef(null)

    useEffect(() => {
    const handleClick = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
        }
    }

    window.addEventListener("click", handleClick)
    return () => window.removeEventListener("click", handleClick)
    }, [])


return (
    <div className={`h-screen w-screen relative overflow-hidden ${
    darkMode ? "bg-[#1e1e1e]" : "bg-white"
    }`}>

        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 ">

        {/* Toolbar */}
        <div
        className={`flex items-center gap-2 shadow-md rounded-xl px-4 py-2 border
            ${darkMode
            ? "bg-[#2a2a2a] border-gray-700"
            : "bg-white border-gray-400/60"
            }
        `}
        >
            <Toolbar 
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            onUndo={() => socketRef.current.emit("undo")}
            onRedo={() => socketRef.current.emit("redo")}
            isToolLocked = {isToolLocked}
            setisToolLocked = {setisToolLocked}
            darkMode = {darkMode}
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
                onBringForward={bringForward}
                onSendBackward={sendBackward}
                onGroup={groupSelectedStrokes}
                onUngroup={ungroupSelectedStrokes}
                canGroup = {canGroup}
                canUngroup = {canUngroup}
                strokeStyle = {strokeStyle}
                setStrokeStyle = {setStrokeStyle}
                fillColor={fillColor}
                setFillColor = {setFillColor}
                setStrokeOpacity={setStrokeOpacity}
                strokeOpacity={strokeOpacity}
                darkMode = {darkMode}
            />
        </div>

        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">

        {/* BOARD NAME CARD */}
        <div  ref = {dropdownRef} className={`relative shadow-md rounded-xl px-2.5 py-2 border h-12 flex items-center gap-2
            ${darkMode
                ? "bg-[#2a2a2a] border-gray-700 text-white"
                : "bg-white border-gray-300/80 text-gray-700"
            }
        `}>

            {/* BOARD NAME */}
            <span className="font-medium text-gray-700 text-xl">
                {boardTitle || "Loading..."}
            </span>

            {/* THREE DOTS (ONLY IF >1 USERS) */}
            {users.length > 1 && (
                <button
                    onClick={() => setShowMembers(prev => !prev)}
                    className="p-1 rounded hover:bg-primary/20 transition"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-6 h-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6h.01M12 12h.01M12 18h.01"
                        />
                    </svg>
                </button>
            )}

            {/* MEMBER COUNT BADGE */}
            {users.length >= 1 && (
                <div className="absolute -bottom-2 -right-2 bg-primary text-white text-[14px] w-6 h-6 flex items-center justify-center rounded-full shadow">
                    {users.length}
                </div>
            )}

        </div>
        { users.length > 1 && (
            <div  className={`absolute top-full left-1/3 -translate-x-1/3 mt-2 
            rounded-lg shadow-sm p-2 flex gap-1 z-50 transition-all duration-200 ease-out
            ${darkMode
                ? "bg-[#2a2a2a] border border-gray-700"
                : "bg-white border border-gray-300/60"
            }
            ${showMembers ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
            `}>

                {users.map(u => (
                    <div
                        key={u.socketId}
                        className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs"
                        title={u.username}
                    >
                        {u.username?.slice(0, 2).toUpperCase()}
                    </div>
                ))}

            </div>
        )}

        {/* SHARE BUTTON (OUTSIDE) */}
        <button
            onClick={()=>{setShowShareModal(true)}}
            className="h-12 px-4 bg-primary text-xl text-white rounded-xl shadow-md hover:bg-primaryDark transition flex items-center"
        >
            Share +
        </button>
        <div ref={menuRef} className="relative">

            <button
                onClick={() => setShowMenu(prev => !prev)}
                className="h-13 w-10 flex items-center justify-center bg-white border border-gray-200/60 rounded-xl shadow-sm hover:bg-gray-50 transition"
            >
                <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6h.01M12 12h.01M12 18h.01" />
                </svg>
            </button>
        </div>
        {showMenu && (
            <div className="absolute right-0 mt-37 w-35 bg-white border border-gray-200/60 rounded-xl shadow-lg z-50">

                <button
                onClick={()=>{
                    handleExportPNG()
                    setShowMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition"
                >
                Export as PNG
                </button>

                <button
                onClick={()=>{
                    handleExportPDF()
                    setShowMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition"
                >
                Export as PDF
                </button>
                <button
                onClick={() => {
                    setDarkMode(prev => {
                    localStorage.setItem("dark-mode", !prev)
                    return !prev
                    })
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                {darkMode ? "☀️" : "🌙"}
                </button>
                <button
                onClick={() => {
                    setShowGrid(prev => {
                    localStorage.setItem("show-grid", !prev)
                    return !prev
                    })
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                {showGrid ? "Grid ON" : "Grid OFF"}
                </button>

            </div>
        )}
        

        </div>
        
        {/* Canvas Area */}
        <div className={`absolute inset-0 ${
            darkMode ? "bg-[#1a1a1a]" : "bg-gray-100"
        }`}>
            <canvas
            className="absolute inset-0 w-full h-full"
            ref={canvasRef}
            onMouseDown={(e) => {
                if (textInput) {
                e.preventDefault()
                e.stopPropagation()
                return
                }
                handlers.onMouseDown(e)
            }}
            onMouseMove={(e) => {
                if (textInput) return
                handlers.onMouseMove(e)
            }}
            onMouseUp={(e) => {
                if (textInput) return
                handlers.onMouseUp(e)
            }}    
            onDoubleClick={(e) => {
                if(tool !== "select") return
                const rect = canvasRef.current.getBoundingClientRect()
                const x = (e.clientX - rect.left - offsetXRef.current) / scaleRef.current
                const y = (e.clientY - rect.top - offsetYRef.current) / scaleRef.current

                const clickedText = strokeRef.current.findLast((stroke) => {
                if (stroke.tool !== "text" || !stroke.points?.length) return false

                const p = stroke.points[0]
                const fontSize = stroke.width * 4
                const text = stroke.text || ""
                const lines = text.split("\n")
                const width = Math.max(...lines.map(line => Math.max(1, line.length) * fontSize * 0.6), 60)
                const height = lines.length * fontSize * 1.2

                return (
                    x >= p.x &&
                    x <= p.x + width &&
                    y >= p.y &&
                    y <= p.y + height
                )
                })

                if (!clickedText) return

                setTextInput({
                id: clickedText.id,
                x: clickedText.points[0].x,
                y: clickedText.points[0].y,
                value: clickedText.text || "",
                color: clickedText.color,
                fontSize: clickedText.width * 4
                })
            }}
            style={{ zIndex: 2 }}
            />
            <canvas 
            ref={gridCanvasRef}
            className='absolute inset-0 w-full h-full pointer-events-none'
            style={{zIndex: 1, border: "2px solid blue"}}
            />
             {/* Drawing canvas */}
        </div>
        {textInput && (
            <div
                className="absolute inset-0 z-50"
                onMouseDown={() => {
                    saveTextEdit()
                }}
            >
                <textarea
                    ref={editorRef}
                    value={textInput.value}
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) =>
                        setTextInput(prev => ({
                            ...prev,
                            value: e.target.value
                        }))
                    }
                    onBlur={saveTextEdit}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            e.preventDefault()
                            setTextInput(null)
                        }
                    }}
                    className="absolute bg-transparent outline-none border-none resize-none overflow-hidden p-0 m-0"
                    style={{
                        left: offsetXRef.current + textInput.x * scaleRef.current,
                        top: offsetYRef.current + textInput.y * scaleRef.current,
                        fontSize: textInput.fontSize * scaleRef.current,
                        lineHeight: `${textInput.fontSize * 1.2 * scaleRef.current}px`,
                        color: textInput.color,
                        fontFamily: "Arial",
                        minWidth: "1px",
                        width: `${editorWidth}px`,
                        height: `${editorHeight}px`,
                        whiteSpace: "pre-wrap",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        boxShadow: "none",
                        resize: "none",
                        overflow: "hidden",
                        caretColor: textInput.color,
                        WebkitAppearance: "none",
                        MozAppearance: "none",
                        appearance: "none"
                    }}
                />
            </div>
        )}
        {showShareModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">

                {/* BACKDROP */}
                <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={() => setShowShareModal(false)}
                />

                {/* MODAL */}
                <div className="relative bg-white rounded-xl shadow-xl p-6 w-100">

                <h2 className="text-lg font-semibold mb-3">
                    Invite to Board
                </h2>

                <p className="text-sm text-gray-500 mb-4">
                    Share this link to collaborate
                </p>

                {/* INPUT */}
                <input
                    value={shareLink}
                    readOnly
                    className="w-full border border-gray-200/60 rounded-md p-2 text-sm mb-3"
                />

                {/* ACTIONS */}
                <div className="flex justify-end gap-2">

                    <button
                    onClick={() => setShowShareModal(false)}
                    className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                    >
                    Close
                    </button>

                    <button
                    onClick={() => {
                        navigator.clipboard.writeText(shareLink)
                    }}
                    className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primaryDark"
                    >
                    Copy Link
                    </button>

                </div>

                </div>
            </div>
            )}

    </div>
  )
}

export default Board