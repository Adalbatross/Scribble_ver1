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
const FILL_COLORS = [
  "rgba(0,0,0,0.5)",
  "rgba(239,68,68,0.5)",
  "rgba(34,197,94,0.5)",
  "rgba(59,130,246,0.5)",
  "rgba(234,179,8,0.5)",
  "rgba(168,85,247,0.5)"
]

const ToolButton = ({ active, onClick, children, title }) => (
  <button
    title={title}
    onClick={onClick}
    className={`w-10 h-10 flex items-center justify-center rounded-lg transition
      ${active 
        ? "bg-primary/70 text-white shadow-sm" 
        : "text-gray-900 hover:bg-primary/20"}
    `}
  >
    {children}
  </button>
)
const ToolOptionsPanel = ({ tool, color, setColor, brushSize, setBrushSize, onBringForward,
    onSendBackward, onGroup, onUngroup, canGroup,
    canUngroup, strokeStyle, setStrokeStyle, fillColor, setFillColor, setStrokeOpacity, strokeOpacity }) => {

  const showColor = ["pen", "rect", "line", "circle","arrow","text"].includes(tool)
  const showSize = ["pen", "line","rect", "circle", "arrow", "text"].includes(tool)
  const showStrokeStyle = ["pen","line","rect", "circle", "arrow"].includes(tool)
  const showFill = ["rect", "circle"].includes(tool)
  const showOpacity = ["pen", "line","rect", "circle", "arrow", "text"].includes(tool) 
  const showLayerControls = tool === "select"

  if (!showColor && !showSize && !showLayerControls && !showStrokeStyle) return null

  return (
    <div className={`w-52 bg-white shadow-md rounded-xl px-3 py-3 border border-gray-300 flex flex-col gap-4 pointer-events-auto
        ${showColor || showSize || showLayerControls || showStrokeStyle ? "flex" : "hidden"}
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

      {showColor && showSize && <div className="border-t border-gray-300/80"></div>}

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
              className="flex-1 accent-primary"
            />
          </div>
        </div>
      )}
      {showStrokeStyle && (
        <>
          {(showColor || showSize) && <div className="border-t border-gray-300/80"></div>}

          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-500 font-medium">Stroke</div>

            <div className="flex gap-2">
              <ToolButton
                active={strokeStyle === "solid"}
                onClick={() => setStrokeStyle("solid")}
                title="Solid"
              >
                ━
              </ToolButton>

              <ToolButton
                active={strokeStyle === "dashed"}
                onClick={() => setStrokeStyle("dashed")}
                title="Dashed"
              >
                ╌╌
              </ToolButton>

              <ToolButton
                active={strokeStyle === "dotted"}
                onClick={() => setStrokeStyle("dotted")}
                title="Dotted"
              >
                ···
              </ToolButton>
            </div>
          </div>
        </>
      )}
      {showFill && (
        <>
          <div className="border-t border-gray-300/80"></div>

          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-500 font-medium">Fill</div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFillColor(null)}
                className="w-6 h-6 border rounded"
                title="No Fill"
              />

              {FILL_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setFillColor(c)}
                  className={`w-6 h-6 rounded ${
                    fillColor === c ? "ring-2 ring-black" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </>
      )}
      {showOpacity && (
        <>
          <div className="border-t border-gray-300/80"></div>

          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-500 font-medium">
              Opacity
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs w-8">
                {Math.round(strokeOpacity * 100)}%
              </span>

              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={strokeOpacity}
                onChange={(e) => setStrokeOpacity(Number(e.target.value))}
                className="flex-1 accent-primary bg-white"
              />
            </div>
          </div>
        </>
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
          {(canGroup || canUngroup) && (
            <div className="border-t pt-3 flex flex-col gap-2">
              <div className="text-xs text-gray-700 font-medium">Group</div>

              <div className="flex gap-2">
                {canGroup && (
                  <ToolButton onClick={onGroup} title="Group (Ctrl+G)">
                    G
                  </ToolButton>
                )}

                {canUngroup && (
                  <ToolButton onClick={onUngroup} title="Ungroup (Ctrl+Shift+G)">
                    U
                  </ToolButton>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ToolOptionsPanel

// NYM2IXKS