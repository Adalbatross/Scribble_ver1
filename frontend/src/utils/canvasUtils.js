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
        if (stroke.tool === "rect"){
            if(stroke.points.length < 2) return 
            const p1 = stroke.points[0]
            const p2 = stroke.points[1]
            
            const width = p2.x -p1.x
            const height = p2.y -p1.y

            ctx.beginPath()
            ctx.rect(p1.x, p1.y, width, height)
            ctx.stroke()
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
    }

export const drawSelectionBox = (ctx, stroke,scale) =>{
    if(!stroke || stroke.points.length < 2) return 

    ctx.save()
    const handleSize = 6 / scale
    ctx.strokeStyle = "#1E90FF"
    ctx.lineWidth  = 2 / scale
    ctx.setLineDash([8 / scale,4 / scale])


    //  RECT
    if (stroke.tool === "rect") {
        const p1 = stroke.points[0]
        const p2 = stroke.points[1]

        const minX = Math.min(p1.x, p2.x)
        const maxX = Math.max(p1.x, p2.x)
        const minY = Math.min(p1.y, p2.y)
        const maxY = Math.max(p1.y, p2.y)

        ctx.strokeRect(minX , minY, maxX - minX, maxY - minY)

        const corners = [
            [minX, minY],
            [maxX, minY],
            [minX, maxY],
            [maxX, maxY],
        ]

        corners.forEach(([x,y])=>{
            ctx.beginPath()
            ctx.arc(x, y , handleSize , 0 , Math.PI * 2)
            ctx.fillStyle = "#0077FF"
            ctx.fill()
        })
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

    ctx.restore() 
}   

export const getStrokeAtPoint = (x,y, strokes, scale) =>{
    for (let i  = strokes.length -1; i>=0; i--){
        const stroke = strokes[i]
        if(stroke.tool === "rect" && stroke.points.length >=2){
            const p1 = stroke.points[0]
            const p2 = stroke.points[1]

            const minX = Math.min(p1.x, p2.x)
            const maxX = Math.max(p1.x, p2.x)
            
            const minY = Math.min(p1.y, p2.y)
            const maxY = Math.max(p1.y, p2.y)

            // if(x>= minX && x<=maxX && y>=minY && y<= maxY){
            //     return stroke
            // } this is the old edge detection algo which helps in the delection inside the shape 

            const threshold = 10 / scale

            const nearLeft   = Math.abs(x - minX) <= threshold && y >= minY && y <= maxY
            const nearRight  = Math.abs(x - maxX) <= threshold && y >= minY && y <= maxY
            const nearTop    = Math.abs(y - minY) <= threshold && x >= minX && x <= maxX
            const nearBottom = Math.abs(y - maxY) <= threshold && x >= minX && x <= maxX

            if (nearLeft || nearRight || nearTop || nearBottom) {
                return stroke
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
    }
    return null
}

export const getHandleAtPoint = (x, y, stroke,scale) => {
    if (!stroke || stroke.points.length < 2) return null

    const radius = 10 / scale

    if (stroke.tool === "rect") {
        const p1 = stroke.points[0]
        const p2 = stroke.points[1]

        const minX = Math.min(p1.x, p2.x)
        const maxX = Math.max(p1.x, p2.x)
        const minY = Math.min(p1.y, p2.y)
        const maxY = Math.max(p1.y, p2.y)

        const corners = [
            { key: "tl", x: minX, y: minY },
            { key: "tr", x: maxX, y: minY },
            { key: "bl", x: minX, y: maxY },
            { key: "br", x: maxX, y: maxY },
        ]

        for (const c of corners) {
            if (Math.hypot(x - c.x, y - c.y) <= radius) return c.key
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

        const xs = stroke.points.map(p => p.x)
        const ys = stroke.points.map(p => p.y)

        minX = Math.min(minX, ...xs)
        minY = Math.min(minY, ...ys)
        maxX = Math.max(maxX, ...xs)
        maxY = Math.max(maxY, ...ys)
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