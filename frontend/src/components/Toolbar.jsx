import React from "react"
import SelectIcon from "../icons/SelectIcon"
import PenIcon from "../icons/PenIcon"
import RectIcon from "../icons/RectIcon"
import LineIcon from "../icons/LineIcon"
import CircleIcon from "../icons/CircleIcon"
import EraserIcon from "../icons/EraserIcon"
import RedoIcon from "../icons/RedoIcon"
import UndoIcon from "../icons/UndoIcon"
import ArrowIcon from "../icons/ArrowIcon"
import TextIcon from "../icons/TextIcon"
import LockIcon from "../icons/LockIcon"


const ToolButton = ({ active, onClick, children, title }) => (
  <button
  title={title}
  onClick={onClick}
  className={`w-10 h-10 flex items-center justify-center rounded-lg transition
    ${active 
    ? "bg-blue-100 text-blue-600 shadow-sm" 
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

const Toolbar = ({ tool, setTool, onUndo, onRedo, isToolLocked, setisToolLocked }) => {
  return (
    <div className="flex items-center gap-2">
      <ToolButton active={isToolLocked} onClick={()=>{setisToolLocked(prev => !prev)}} title="lock tool" >
        <LockIcon />
      </ToolButton>

      <ToolButton active={tool === "select"} onClick={() => setTool("select")} >
        <SelectIcon />
      </ToolButton>

      <ToolButton active={tool === "pen"} onClick={() => {setTool("pen")
        window.dispatchEvent(new Event("clear-selection"))
      }}>
        <PenIcon />
      </ToolButton>


      <ToolButton active={tool === "line"} onClick={() => {setTool("line")
        window.dispatchEvent(new Event("clear-selection"))
      }}>
        <LineIcon />
      </ToolButton>

      <ToolButton active={tool === "arrow"} onClick={() => {setTool("arrow") 
        window.dispatchEvent(new Event("clear-selection"))
      }}>
      <ArrowIcon />
      </ToolButton>
      
      <ToolButton
        active={tool === "rect"}
        onClick={() => {
          setTool("rect")
          window.dispatchEvent(new Event("clear-selection"))
        }}
      >
        <RectIcon />
      </ToolButton>

      <ToolButton active={tool === "circle"} onClick={() => {setTool("circle")
        window.dispatchEvent(new Event("clear-selection"))
      }}>
        <CircleIcon />
      </ToolButton>

      <ToolButton active={tool === "text"} onClick={() => {setTool("text")
        // window.dispatchEvent(new Event("clear-selection"))
      }}>
        <TextIcon />
      </ToolButton>

      <ToolButton active={tool === "eraser"} onClick={() => {setTool("eraser")
        window.dispatchEvent(new Event("clear-selection"))
      }}>
        <EraserIcon />
      </ToolButton>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* Undo / Redo */}
      <ToolButton onClick={onUndo}>
        <UndoIcon />
      </ToolButton>

      <ToolButton onClick={onRedo}>
        <RedoIcon />
      </ToolButton>

    </div>
  )
}

export default Toolbar