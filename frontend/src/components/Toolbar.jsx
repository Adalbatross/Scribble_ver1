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


const ToolButton = ({ active, onClick, children, title, darkMode }) => (
  <button
    title={title}
    onClick={onClick}
    className={`w-10 h-10 flex items-center justify-center rounded-lg transition
      ${
        active
          ? "bg-primary/70 text-white shadow-sm"
          : darkMode
            ? "text-gray-300 hover:bg-white/10"
            : "text-gray-600 hover:bg-primary/20"
      }
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

const Toolbar = ({ tool, setTool, onUndo, onRedo, isToolLocked, setisToolLocked, darkMode }) => {
  return (
    <div className="flex items-center gap-2">
      <ToolButton darkMode={darkMode} active={isToolLocked} onClick={()=>{setisToolLocked(prev => !prev)}} title="lock tool" >
        <LockIcon />
      </ToolButton>

      <ToolButton darkMode={darkMode} active={tool === "select"} onClick={() => setTool("select")} >
        <SelectIcon />
      </ToolButton>

      <ToolButton darkMode={darkMode} active={tool === "pen"} onClick={() => {setTool("pen")
        window.dispatchEvent(new Event("clear-selection"))
      }}>
        <PenIcon />
      </ToolButton>


      <ToolButton darkMode={darkMode} active={tool === "line"} onClick={() => {setTool("line")
        window.dispatchEvent(new Event("clear-selection"))
      }}>
        <LineIcon />
      </ToolButton>

      <ToolButton darkMode={darkMode} active={tool === "arrow"} onClick={() => {setTool("arrow") 
        window.dispatchEvent(new Event("clear-selection"))
      }}>
      <ArrowIcon />
      </ToolButton>
      
      <ToolButton
        darkMode={darkMode}
        active={tool === "rect"}
        onClick={() => {
          setTool("rect")
          window.dispatchEvent(new Event("clear-selection"))
        }}
      >
        <RectIcon />
      </ToolButton>

      <ToolButton darkMode={darkMode} active={tool === "circle"} onClick={() => {setTool("circle")
        window.dispatchEvent(new Event("clear-selection"))
      }}>
        <CircleIcon />
      </ToolButton>

      <ToolButton darkMode={darkMode} active={tool === "text"} onClick={() => {setTool("text")
        // window.dispatchEvent(new Event("clear-selection"))
      }}>
        <TextIcon />
      </ToolButton>

      <ToolButton darkMode={darkMode} active={tool === "eraser"} onClick={() => {setTool("eraser")
        window.dispatchEvent(new Event("clear-selection"))
      }}>
        <EraserIcon />
      </ToolButton>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* Undo / Redo */}
      <ToolButton darkMode={darkMode} onClick={onUndo}>
        <UndoIcon />
      </ToolButton>

      <ToolButton darkMode={darkMode} onClick={onRedo}>
        <RedoIcon />
      </ToolButton>

    </div>
  )
}

export default Toolbar