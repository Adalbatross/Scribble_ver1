export const getRectBounds = (stroke) => {
    if (!stroke || stroke.tool !== "rect" || stroke.points.length < 2) {
        return null
    }

    const p1 = stroke.points[0]
    const p2 = stroke.points[1]

    return {
        minX: Math.min(p1.x, p2.x),
        maxX: Math.max(p1.x, p2.x),
        minY: Math.min(p1.y, p2.y),
        maxY: Math.max(p1.y, p2.y),
    }
}

export const getRectCenter = (stroke) => {
    const bounds = getRectBounds(stroke)
    if (!bounds) return null

    return {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2
    }
}
export const getRectRotateHandle = (stroke, scale = 1) => {
    const bounds = getRectBounds(stroke)
    const center = getRectCenter(stroke)

    if(!bounds || !center) return null

    // const { minY } = bounds
    const rotation  = stroke.rotation || 0
    const offset = 30 / scale

    const halfHeight = (bounds.maxY - bounds.minY) / 2

    return {
        x: center.x + Math.sin(rotation) * (halfHeight + offset),
        y: center.y - Math.cos(rotation) * (halfHeight + offset)
    }
}