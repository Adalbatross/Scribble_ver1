import React from "react"
import SelectIcon from "../icons/SelectIcon"
import PenIcon from "../icons/PenIcon"
import RectIcon from "../icons/RectIcon"
import LineIcon from "../icons/LineIcon"
import CircleIcon from "../icons/CircleIcon"
import EraserIcon from "../icons/EraserIcon"
import RedoIcon from "../icons/RedoIcon"
import UndoIcon from "../icons/UndoIcon"

const ToolButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg transition flex items-center justify-center
      ${active 
        ? "bg-blue-100 text-blue-600 scale-110 shadow-sm" 
        : "text-gray-600 hover:bg-gray-100"}
    `}
  >
    {children}
  </button>
)
const COLORS = [
  "#000000",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#a855f7"
]

const Toolbar = ({ tool, setTool, onUndo, color, onRedo, setColor, brushSize, setBrushSize }) => {
  return (
    <div className="w-16 border-r flex flex-col items-center py-4 space-y-4 bg-gray-50">

      <ToolButton active={tool === "select"} onClick={() => setTool("select")}>
        <SelectIcon />
      </ToolButton>

      <ToolButton active={tool === "pen"} onClick={() => setTool("pen")}>
        <PenIcon />
      </ToolButton>

      <ToolButton active={tool === "rect"} onClick={() => setTool("rect")}>
        <RectIcon />
      </ToolButton>

      <ToolButton active={tool === "line"} onClick={() => setTool("line")}>
        <LineIcon />
      </ToolButton>

      <ToolButton active={tool === "circle"} onClick={() => setTool("circle")}>
        <CircleIcon />
      </ToolButton>

      <ToolButton active={tool === "eraser"} onClick={() => setTool("eraser")}>
        <EraserIcon />
      </ToolButton>

      {/* Divider */}
      <div className="w-8 border-t my-2"></div>

      {/* Undo / Redo */}
      <ToolButton onClick={onUndo}>
        <UndoIcon />
      </ToolButton>

      <ToolButton onClick={onRedo}>
        <RedoIcon />
      </ToolButton>

      {/* Divider */}
      <div className="w-8 border-t my-2"></div>

      {/* Color */}
      <div className="flex flex-col items-center space-y-2">

        {/* preset colors */}
        <div className="grid grid-cols-2 gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 ${
                color === c ? "border-black scale-110" : "border-gray-300"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* custom picker */}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 cursor-pointer border rounded"
        />
      </div>

      {/* Brush */}
      <div className="flex flex-col items-center space-y-2">

        {/* preview */}
        <div
          style={{
            width: brushSize,
            height: brushSize,
            backgroundColor: color,
            borderRadius: "50%"
          }}
        />

        {/* slider */}
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(e.target.value)}
          className="w-16 accent-blue-500"
        />

        {/* label */}
        <div className="text-xs text-gray-500">
          {brushSize}px
        </div>
      </div>
    </div>
  )
}

export default Toolbar