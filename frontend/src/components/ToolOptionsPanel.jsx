import BringTofront from "../icons/BringTofront"
import SendToBack from "../icons/SendToBack"

const COLORS = [
  "#000000",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#a855f7"
]

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
const ToolOptionsPanel = ({ tool, color, setColor, brushSize, setBrushSize, onBringForward, onSendBackward }) => {

  const showColor = ["pen", "rect", "line", "circle","arrow","text"].includes(tool)
  const showSize = ["pen", "line","rect", "circle", "arrow", "text"].includes(tool)
  const showLayerControls = tool === "select"

  if (!showColor && !showSize && !showLayerControls) return null

  return (
    <div className={`w-52 bg-white shadow-md rounded-xl px-3 py-3 border flex flex-col gap-4 pointer-events-auto
        ${showColor || showSize || showLayerControls ? "flex" : "hidden"}
    `}>

      {showColor && (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-500 font-medium">Color</div>

          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition
                  ${color === c ? "ring-2 ring-black scale-110" : "hover:scale-105"}
                `}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}

      {showColor && showSize && <div className="border-t"></div>}

      {showSize && (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-500 font-medium">Size</div>

          <div className="flex items-center gap-3">
            <div
              style={{
                width: brushSize,
                height: brushSize,
                backgroundColor: color,
                borderRadius: "50%"
              }}
            />

            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="flex-1 accent-blue-500"
            />
          </div>
        </div>
      )}

      {showLayerControls && (
        <>
          {/* <div className="border-t"></div> */}

          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-700 font-medium">Arrange</div>

            <div className="flex gap-2">
              <ToolButton
                onClick={onBringForward}
                title="Bring to Front"
              >
                <BringTofront />
              </ToolButton>

              <ToolButton
                onClick={onSendBackward}
                title="Send to Back"
              >
                <SendToBack />
              </ToolButton>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ToolOptionsPanel