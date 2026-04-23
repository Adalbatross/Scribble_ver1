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
            : "text-gray-900 hover:bg-primary/20"
      }
    `}
  >
    {children}
  </button>
)
const ToolOptionsPanel = ({ tool, color, setColor, brushSize, setBrushSize, onBringForward,
    onSendBackward, onGroup, onUngroup, canGroup,
    canUngroup, strokeStyle, setStrokeStyle, fillColor, setFillColor, setStrokeOpacity, strokeOpacity, darkMode }) => {

  const showColor = ["pen", "rect", "line", "circle","arrow","text"].includes(tool)
  const showSize = ["pen", "line","rect", "circle", "arrow", "text"].includes(tool)
  const showStrokeStyle = ["pen","line","rect", "circle", "arrow"].includes(tool)
  const showFill = ["rect", "circle"].includes(tool)
  const showOpacity = ["pen", "line","rect", "circle", "arrow", "text"].includes(tool) 
  const showLayerControls = tool === "select"

  if (!showColor && !showSize && !showLayerControls && !showStrokeStyle) return null

  return (
<div
  className={`w-52 shadow-md rounded-xl px-3 py-3 border flex flex-col gap-4 pointer-events-auto
    ${darkMode
      ? "bg-[#2a2a2a] border-gray-700 text-gray-200"
      : "bg-white border-gray-300 text-gray-900"
    }
  `}
>

      {showColor && (
        <div className="flex flex-col gap-2">
          <div className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Color</div>

          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition
                  ${color === c 
                    ? `ring-2 ${darkMode ? "ring-white" : "ring-black"} scale-110` 
                    : "hover:scale-105"
                  }
                `}
                style={{
                  backgroundColor:
                    darkMode && c === "#000000" ? "#ffffff" : c
                }}
              />
            ))}
          </div>
        </div>
      )}

      {showColor && showSize && <div className="border-t border-gray-300/80"></div>}

      {showSize && (
        <div className="flex flex-col gap-2">
          <div className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Size</div>

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
              className={`flex-1 accent-primary rounded-lg ${
                darkMode ? "bg-gray-600" : "bg-gray-200"
              }`}
              />
          </div>
        </div>
      )}
      {showStrokeStyle && (
        <>
          {(showColor || showSize) && <div className="border-t border-gray-300/80"></div>}

          <div className="flex flex-col gap-2">
            <div className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Stroke</div>

            <div className="flex gap-2">
              <ToolButton
                darkMode={darkMode}
                active={strokeStyle === "solid"}
                onClick={() => setStrokeStyle("solid")}
                title="Solid"
                >
                ━
              </ToolButton>

              <ToolButton
                darkMode={darkMode}
                active={strokeStyle === "dashed"}
                onClick={() => setStrokeStyle("dashed")}
                title="Dashed"
                >
                ╌╌
              </ToolButton>

              <ToolButton
                darkMode={darkMode}
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
            <div className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Fill</div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFillColor(null)}
                className={`w-6 h-6 border rounded ${
                  darkMode ? "border-gray-600 bg-transparent" : "border-gray-300 bg-white"
                }`}
                title="No Fill"
                />

              {FILL_COLORS.map(c => (
                <button
                key={c}
                onClick={() => setFillColor(c)}
                className={`w-6 h-6 rounded ${fillColor === c
                  ? `ring-2 ${darkMode ? "ring-white" : "ring-black"}`
                  : ""
                }`}
                  style={{
                    backgroundColor:
                      darkMode && c === "rgba(0,0,0,0.5)"
                        ? "rgba(255,255,255,0.5)"
                        : c
                  }}
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
            <div className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
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
                className={`flex-1 accent-primary rounded-lg ${
                  darkMode ? "bg-gray-600" : "bg-gray-200"
                }`}
                />
            </div>
          </div>
        </>
      )}

      {showLayerControls && (
        <>
          {/* <div className="border-t"></div> */}

          <div className="flex flex-col gap-2">
            <div className={`text-xs font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Arrange</div>

            <div className="flex gap-2">
              <ToolButton
                darkMode={darkMode}
                onClick={onBringForward}
                title="Bring to Front"
                >
                <BringTofront />
              </ToolButton>

              <ToolButton
                darkMode={darkMode}
                onClick={onSendBackward}
                title="Send to Back"
                >
                <SendToBack />
              </ToolButton>
            </div>
          </div>
          {(canGroup || canUngroup) && (
            <div className="border-t pt-3 flex flex-col gap-2">
              <div className={`text-xs font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Group</div>

              <div className="flex gap-2">
                {canGroup && (
                  <ToolButton 
                  darkMode={darkMode}
                  onClick={onGroup} title="Group (Ctrl+G)">
                    G
                  </ToolButton>
                )}

                {canUngroup && (
                  <ToolButton 
                  darkMode={darkMode}
                  onClick={onUngroup} title="Ungroup (Ctrl+Shift+G)">
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