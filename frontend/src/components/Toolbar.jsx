import React from "react"

const Toolbar = ({ tool, setTool, onUndo, color, setColor, brushSize, setBrushSize }) => {
  return (
    <div className="w-16 border-r flex flex-col items-center py-4 space-y-6 bg-gray-50 px-10">

      <button
        onClick={() => setTool("pen")}
        className={`w-10 h-10 rounded-md border ${tool === "pen" ? "bg-gray-300" : ""}`}
      >
        ✏️
      </button>

      <button
        onClick={() => setTool("eraser")}
        className={`w-10 h-10 rounded-md border ${tool === "eraser" ? "bg-gray-300" : ""}`}
      >
        🧽
      </button>

      <button
        onClick={onUndo}
        className="w-10 h-10 rounded-md border"
      >
        ↩
      </button>
      {/* Divider */}
      <div className="w-10 border-t"></div>
      {/* color picker */}
      <input type="color"
      value={color}
      onChange={(e)=>setColor(e.target.value)}
      className="w-10 h-10 cursor-pointer" />  

      {/* brush size label */}
      <input
        type="range"
        min="1"
        max="20"
        value={brushSize}
        onChange={(e)=>{setBrushSize(e.target.value)}}
        className="w-16"
      />
      <div className="text-xs text-gray-600">
        {brushSize}px
      </div>
    </div>
  )
}

export default Toolbar