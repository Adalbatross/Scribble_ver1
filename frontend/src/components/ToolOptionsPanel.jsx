const COLORS = [
  "#000000",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#a855f7"
]

const ToolOptionsPanel = ({ tool, color, setColor, brushSize, setBrushSize }) => {

  const showColor = ["pen", "rect", "line", "circle","arrow"].includes(tool)
  const showSize = ["pen", "line","rect", "circle", "arrow"].includes(tool)

  if (!showColor && !showSize) return null

  return (
    <div className={`w-52 bg-white shadow-md rounded-xl px-3 py-3 border flex flex-col gap-4 pointer-events-auto
        ${showColor || showSize ? "flex" : "hidden"}
    `}>

      {/* COLOR */}
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
      <div className="border-t"></div>

      {/* SIZE */}
      {showSize && (
        <div className="flex flex-col gap-2">
        <div className="text-xs text-gray-500 font-medium">Size</div>

        <div className="flex items-center gap-3">

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
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="flex-1 accent-blue-500"
            />

        </div>
        </div>
      )}
    </div>
  )
}

export default ToolOptionsPanel