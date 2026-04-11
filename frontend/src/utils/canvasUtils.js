import { distanceToSegment, getRectBounds, getRotatedRectCorners } from "./rectUtils"


export const drawStroke = (ctx, stroke) =>{
        if (!stroke.points.length) return
        ctx.lineWidth = stroke.width
        ctx.strokeStyle = stroke.color
        
        
        if (stroke.tool === "eraser") {
            ctx.globalCompositeOperation = "destination-out"
        } else {
            ctx.globalCompositeOperation = "source-over"
        }
        if (stroke.tool == "pen" || stroke.tool == "eraser"){
            ctx.beginPath()
            const first = stroke.points[0]
            ctx.moveTo(first.x, first.y)
            
            for (let i = 1; i < stroke.points.length; i++) {
                const point = stroke.points[i]
                ctx.lineTo(point.x, point.y)
            }
            
            ctx.stroke()
        }
        if (stroke.tool === "rect" && stroke.center && stroke.rectSize) {
            const { x, y } = stroke.center
            const { width, height } = stroke.rectSize
            const rotation = stroke.rotation || 0

            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(rotation)

            ctx.beginPath()
            ctx.rect(-width / 2, -height / 2, width, height)
            ctx.stroke()

            ctx.restore()
        }
        if((stroke.tool === "line" || stroke.tool === "arrow" ) && stroke.points.length >= 2){
            const p1 = stroke.points[0]
            const p2 = stroke.points[1]

            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()

            if (stroke.tool === "arrow") {
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)

                // arrow head size based on stroke width
                const headLength = Math.max(12, stroke.width * 3)
                const headAngle = Math.PI / 7

                const x1 = p2.x - headLength * Math.cos(angle - headAngle)
                const y1 = p2.y - headLength * Math.sin(angle - headAngle)

                const x2 = p2.x - headLength * Math.cos(angle + headAngle)
                const y2 = p2.y - headLength * Math.sin(angle + headAngle)

                ctx.beginPath()
                ctx.moveTo(p2.x, p2.y)
                ctx.lineTo(x1, y1)
                ctx.moveTo(p2.x, p2.y)
                ctx.lineTo(x2, y2)
                ctx.stroke()
            }
        }
        if (stroke.tool === "circle" && stroke.points.length>=2){
            const p1 = stroke.points[0]
            const p2 = stroke.points[1]

            const dx = p2.x - p1.x
            const dy = p2.y - p1.y

            const radius  = Math.sqrt(dx*dx + dy*dy)
            ctx.beginPath()
            ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2)
            ctx.stroke()
        }
        if (stroke.tool === "text" && stroke.points.length >= 1) {
            if (window.__editingTextId && stroke.id === window.__editingTextId) return

            const p = stroke.points[0]
            const lines = (stroke.text || "Text").split("\n")
            const fontSize = stroke.width * 4
            const lineHeight = fontSize * 1.2

            ctx.save()
            ctx.globalCompositeOperation = "source-over"
            ctx.font = `${fontSize}px Arial`
            ctx.fillStyle = stroke.color
            ctx.textBaseline = "top"

            lines.forEach((line, index) => {
                ctx.fillText(line, p.x, p.y + index * lineHeight)
            })

            ctx.restore()
        }
    }

export const drawSelectionBox = (ctx, stroke,scale) =>{
    if(!stroke || stroke.points.length < 1) return 
    if (stroke.tool === "text" && window.__editingTextId === stroke.id) return

    ctx.save()
    ctx.globalCompositeOperation = "source-over"
    ctx.globalAlpha = 1
    const handleSize = 6 / scale
    ctx.strokeStyle = "#1E90FF"
    ctx.lineWidth  = 2 / scale
    ctx.setLineDash([8 / scale,4 / scale])

    if (stroke.tool === "text" && stroke.points.length >= 1) {

        const bounds = getTextBounds(stroke)
        if (!bounds) return

        const { x, y, width: textWidth, height: textHeight } = bounds

        ctx.strokeRect(x, y, textWidth, textHeight)

        ctx.beginPath()
        ctx.arc(x + textWidth, y + textHeight, handleSize, 0, Math.PI * 2)
        ctx.fillStyle = "#0077FF"
        ctx.fill()
    }

    //  RECT
    if (stroke.tool === "rect" && stroke.center && stroke.rectSize) {
        const { x, y } = stroke.center
        const { width, height } = stroke.rectSize
        const rotation = stroke.rotation || 0

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rotation)

        ctx.strokeStyle = "#0077FF"
        ctx.lineWidth = 1 / scale

        // selection outline
        ctx.beginPath()
        ctx.rect(-width / 2, -height / 2, width, height)
        ctx.stroke()

        const handleSizeLocal = 6 

        const corners = [
            { key: "tl", x: -width / 2, y: -height / 2 },
            { key: "tr", x:  width / 2, y: -height / 2 },
            { key: "br", x:  width / 2, y:  height / 2 },
            { key: "bl", x: -width / 2, y:  height / 2 },
        ]

        // draw handles
        corners.forEach(c => {
            ctx.beginPath()
            ctx.arc(c.x, c.y, handleSizeLocal, 0, Math.PI * 2)
            ctx.fillStyle = "#0077FF"
            ctx.fill()
        })

        // rotate handle (top middle)
        const offset = 30 
        const rx = 0
        const ry = -height / 2 - offset

        ctx.beginPath()
        ctx.moveTo(0, -height / 2)
        ctx.lineTo(rx, ry)
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(rx, ry, handleSizeLocal, 0, Math.PI * 2)
        ctx.fillStyle = "#0077FF"
        ctx.fill()

        ctx.restore()
    }

    //  LINE
    if (stroke.tool === "line" || stroke.tool === "arrow") {
        const p1 = stroke.points[0]
        const p2 = stroke.points[1]

        // dashed overlay
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()

        // handles at both ends
        ;[
            { point: p1, key: "start" },
            { point: p2, key: "end" }
        ].forEach(({ point, key }) => {
            ctx.beginPath()

            // arrow tip handle slightly bigger
            const size =
                stroke.tool === "arrow" && key === "end"
                    ? handleSize * 1.25
                    : handleSize

            ctx.arc(point.x, point.y, size, 0, Math.PI * 2)
            ctx.fillStyle = "#0077FF"
            ctx.fill()
        })
    }

    //  CIRCLE
    if (stroke.tool === "circle") {
        const p1 = stroke.points[0] // center
        const p2 = stroke.points[1] // radius point

        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const radius = Math.sqrt(dx*dx + dy*dy)

        // dashed circle
        ctx.beginPath()
        ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2)
        ctx.stroke()

        // center handle
        ctx.beginPath()
        ctx.arc(p1.x, p1.y, handleSize, 0, Math.PI * 2)
        ctx.fillStyle = "#0077FF"
        ctx.fill()

        // radius handle
        ctx.beginPath()
        ctx.arc(p2.x, p2.y, handleSize, 0, Math.PI * 2)
        ctx.fillStyle = "#0077FF"
        ctx.fill()
    }
    
    ctx.setLineDash([])
    ctx.restore() 
}   
const getTextBounds = (stroke) => {
    if (!stroke || stroke.tool !== "text" || !stroke.points?.length) {
        return null
    }

    const p = stroke.points[0]
    const text = stroke.text || ""
    const fontSize = stroke.width * 4
    const lineHeight = fontSize * 1.2
    const lines = text.split("\n")

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    ctx.font = `${fontSize}px Arial`

    const width = Math.max(
        1,
        ...lines.map(line => ctx.measureText(line || " ").width)
    )

    const height = Math.max(lineHeight, lines.length * lineHeight)

    return {
        x: p.x,
        y: p.y,
        width: width + 2,
        height: height + 2
    }
}
export const getStrokeAtPoint = (x,y, strokes, scale) =>{
    for (let i  = strokes.length -1; i>=0; i--){
        const stroke = strokes[i]
        if (stroke.tool === "rect" && stroke.points.length >= 2) {
            const corners = getRotatedRectCorners(stroke)
            if (!corners) continue

            const threshold = 10 / scale

            const edges = [
                [corners[0], corners[1]], // top of the rectangle
                [corners[1], corners[2]], // right
                [corners[2], corners[3]], // bottom
                [corners[3], corners[0]], // left
            ]

            for (const [a, b] of edges) {
                const dist = distanceToSegment(x, y, a.x, a.y, b.x, b.y)
                if (dist <= threshold) {
                    return stroke
                }
            }
        }
        if (stroke.tool === "pen" && stroke.points.length > 1) {
            for (let i = 0; i < stroke.points.length - 1; i++) {
                const p1 = stroke.points[i]
                const p2 = stroke.points[i + 1]

                const A = x - p1.x
                const B = y - p1.y
                const C = p2.x - p1.x
                const D = p2.y - p1.y

                const dot = A * C + B * D
                const lenSq = C * C + D * D
                let param = lenSq !== 0 ? dot / lenSq : -1

                let nearX, nearY
                if (param < 0) { nearX = p1.x; nearY = p1.y }
                else if (param > 1) { nearX = p2.x; nearY = p2.y }
                else {
                    nearX = p1.x + param * C
                    nearY = p1.y + param * D
                }

                const dist = Math.sqrt((x - nearX) ** 2 + (y - nearY) ** 2)

                if (dist <= 10 / scale) {
                    return stroke
                }
            }
        }
        if ((stroke.tool === "line" || stroke.tool === "arrow") && stroke.points.length >= 2) {
            const p1 = stroke.points[0]
            const p2 = stroke.points[1]

            const A = x - p1.x
            const B = y - p1.y
            const C = p2.x - p1.x
            const D = p2.y - p1.y

            const dot = A * C + B * D
            const lenSq = C * C + D * D
            let param = lenSq !== 0 ? dot / lenSq : -1

            let nearX, nearY
            if (param < 0) { nearX = p1.x; nearY = p1.y }
            else if (param > 1) { nearX = p2.x; nearY = p2.y }
            else {
                nearX = p1.x + param * C
                nearY = p1.y + param * D
            }

            const dist = Math.sqrt((x - nearX) ** 2 + (y - nearY) ** 2)

            if (dist <= 10 / scale) return stroke
        }

        if (stroke.tool === "circle" && stroke.points.length >= 2) {
            const p1 = stroke.points[0]
            const p2 = stroke.points[1]

            const dx = p2.x - p1.x
            const dy = p2.y - p1.y
            const radius = Math.sqrt(dx*dx + dy*dy)

            const dist = Math.sqrt((x - p1.x)**2 + (y - p1.y)**2)

            // if ( dist <= radius + 10 / scale) {
            //     return stroke
            // } same for this detection of the whole shpe inside the shape

            const threshold = 10 / scale

            if (Math.abs(dist -radius) <= threshold) {
                return stroke
            }

        }

        if (stroke.tool === "text" && stroke.points.length >= 1) {
            const bounds = getTextBounds(stroke)
            if (!bounds) continue

            const { x: bx, y: by, width, height } = bounds

            if (
                x >= bx &&
                x <= bx + width &&
                y >= by &&
                y <= by + height
            ) {
                return stroke
            }
        }
    }
    return null
}

export const getHandleAtPoint = (x, y, stroke,scale) => {
    if (!stroke || stroke.points.length < 1) return null

    const radius = 10 / scale

    if (stroke.tool === "rect" && stroke.center && stroke.rectSize) {
        const { x: cx, y: cy } = stroke.center
        const { width, height } = stroke.rectSize
        const rotation = stroke.rotation || 0

        const radius = 10 / scale

        // 🔥 convert mouse → local rect space
        const dx = x - cx
        const dy = y - cy

        const localX = dx * Math.cos(-rotation) - dy * Math.sin(-rotation)
        const localY = dx * Math.sin(-rotation) + dy * Math.cos(-rotation)

        // corner handles (local space)
        const handles = [
            { key: "tl", x: -width / 2, y: -height / 2 },
            { key: "tr", x:  width / 2, y: -height / 2 },
            { key: "br", x:  width / 2, y:  height / 2 },
            { key: "bl", x: -width / 2, y:  height / 2 },
        ]

        for (const h of handles) {
            if (Math.hypot(localX - h.x, localY - h.y) <= radius) {
                return h.key
            }
        }

        // rotate handle (top center)
        const offset = 30
        const rx = 0
        const ry = -height / 2 - offset

        if (Math.hypot(localX - rx, localY - ry) <= radius) {
            return "rotate"
        }
    }

    if (stroke.tool === "line" || stroke.tool === "arrow") {
        const [p1, p2] = stroke.points

        if (Math.hypot(x - p1.x, y - p1.y) <= radius) return "start"
        if (Math.hypot(x - p2.x, y - p2.y) <= radius) return "end"
    }

    if (stroke.tool === "circle") {
        const [p1, p2] = stroke.points

        if (Math.hypot(x - p1.x, y - p1.y) <= radius) return "center"
        if (Math.hypot(x - p2.x, y - p2.y) <= radius) return "radius"
    }

    if (stroke.tool === "text" && stroke.points.length >= 1) {
        const bounds = getTextBounds(stroke)
        if (!bounds) return null

        const { x: bx, y: by, width, height } = bounds

        const handleX = bx + width
        const handleY = by + height

        const dx = x - handleX
        const dy = y - handleY

        if (Math.sqrt(dx * dx + dy * dy) <= radius) {
            return "br"
        }
    }

    return null
}

export const getGroupBounds = (strokes) => {
    if (!strokes || strokes.length === 0) return null

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    strokes.forEach((stroke) => {
        if (!stroke.points || stroke.points.length === 0) return

        if (stroke.tool === "text") {
            const bounds = getTextBounds(stroke)
            if (!bounds) return

            minX = Math.min(minX, bounds.x)
            minY = Math.min(minY, bounds.y)
            maxX = Math.max(maxX, bounds.x + bounds.width)
            maxY = Math.max(maxY, bounds.y + bounds.height)
        } else {
            
            if (stroke.tool === "rect" && stroke.center && stroke.rectSize) {
                const { x, y } = stroke.center
                const { width, height } = stroke.rectSize

                const rMinX = x - width / 2
                const rMaxX = x + width / 2
                const rMinY = y - height / 2
                const rMaxY = y + height / 2

                minX = Math.min(minX, rMinX)
                minY = Math.min(minY, rMinY)
                maxX = Math.max(maxX, rMaxX)
                maxY = Math.max(maxY, rMaxY)
            }
            else {
                const xs = stroke.points.map(p => p.x)
                const ys = stroke.points.map(p => p.y)

                minX = Math.min(minX, ...xs)
                minY = Math.min(minY, ...ys)
                maxX = Math.max(maxX, ...xs)
                maxY = Math.max(maxY, ...ys)
            }
        }
    })

    return { minX, minY, maxX, maxY }
}
export const isPointInGroupBounds = (x, y , bounds, scale = 1) => {
    if(!bounds) return false

    const padding = 10 / scale

    return (
        x >= bounds.minX - padding &&
        x <= bounds.maxX + padding &&
        y >= bounds.minY - padding &&
        y <= bounds.maxY + padding 
    )
}

export const isStrokeInBounds = (stroke, bounds) => {
    if (!stroke.points || stroke.points.length === 0) return false

    let minX, maxX, minY, maxY
    if (stroke.tool === "rect") {
        const rectBounds = getRectBounds(stroke)
        if (!rectBounds) return false

        const { minX: rMinX, maxX: rMaxX, minY: rMinY, maxY: rMaxY } = rectBounds

        const overlaps =
            bounds.maxX >= rMinX &&
            bounds.minX <= rMaxX &&
            bounds.maxY >= rMinY &&
            bounds.minY <= rMaxY

        return overlaps
    }
    // if (stroke.tool === "circle") {
    //     const p1 = stroke.points[0] // center
    //     const p2 = stroke.points[1] // radius point

    //     const dx = p2.x - p1.x
    //     const dy = p2.y - p1.y
    //     const radius = Math.sqrt(dx * dx + dy * dy)

    //     // closest point on marquee bounds to circle center
    //     const nearestX = Math.max(bounds.minX, Math.min(p1.x, bounds.maxX))
    //     const nearestY = Math.max(bounds.minY, Math.min(p1.y, bounds.maxY))

    //     const distToCenter = Math.sqrt((nearestX - p1.x) ** 2 + (nearestY - p1.y) ** 2)

    //     // marquee must touch the arc edge, not just be inside the circle
    //     const centerInsideMarquee = 
    //         p1.x >= bounds.minX && p1.x <= bounds.maxX &&
    //         p1.y >= bounds.minY && p1.y <= bounds.maxY

    //     return distToCenter <= radius && !centerInsideMarquee
    // }
    if (stroke.tool === "text") {
        const boundsObj = getTextBounds(stroke)
        if (!boundsObj) return false

        minX = boundsObj.x
        minY = boundsObj.y
        maxX = boundsObj.x + boundsObj.width
        maxY = boundsObj.y + boundsObj.height
    }
    // if (stroke.tool === "circle") {
    //     const p1 = stroke.points[0]
    //     const p2 = stroke.points[1]

    //     const dx = p2.x - p1.x
    //     const dy = p2.y - p1.y
    //     const radius = Math.sqrt(dx*dx + dy*dy)

    //     minX = p1.x - radius
    //     maxX = p1.x + radius
    //     minY = p1.y - radius
    //     maxY = p1.y + radius
    // } 
    else {
        const xs = stroke.points.map(p => p.x)
        const ys = stroke.points.map(p => p.y)

        minX = Math.min(...xs)
        maxX = Math.max(...xs)
        minY = Math.min(...ys)
        maxY = Math.max(...ys)
    }

    return !(
        maxX <= bounds.minX || 
        minX >= bounds.maxX || 
        maxY <= bounds.minY ||
        minY >= bounds.maxY
    )
}