export const getRectBounds = (stroke) => {
    if (!stroke.center || !stroke.rectSize) return null

    const { x, y } = stroke.center
    const { width, height } = stroke.rectSize

    return {
        minX: x - width / 2,
        maxX: x + width / 2,
        minY: y - height / 2,
        maxY: y + height / 2,
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
export const getRotatedRectCorners = (stroke) => {
    const bounds = getRectBounds(stroke)
    const center = getRectCenter(stroke)

    if (!bounds || !center) return null

    const rotation = stroke.rotation || 0
    const halfW = (bounds.maxX - bounds.minX) / 2
    const halfH = (bounds.maxY - bounds.minY) / 2

    const localCorners = [
        { key: "tl", x: -halfW, y: -halfH },
        { key: "tr", x: halfW, y: -halfH },
        { key: "br", x: halfW, y: halfH },
        { key: "bl", x: -halfW, y: halfH },
    ]

    return localCorners.map(corner => ({
        key: corner.key,
        x: center.x + corner.x * Math.cos(rotation) - corner.y * Math.sin(rotation),
        y: center.y + corner.x * Math.sin(rotation) + corner.y * Math.cos(rotation),
    }))
}

export const distanceToSegment = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1
    const dy = y2 - y1

    if (dx === 0 && dy === 0) {
        return Math.hypot(px - x1, py - y1)
    }

    const t = Math.max(
        0,
        Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy))
    )

    const projX = x1 + t * dx
    const projY = y1 + t * dy

    return Math.hypot(px - projX, py - projY)
}

export const rotatePoint = (px, py, cx, cy, angle) => {
    const dx = px - cx
    const dy = py - cy

    return {
        x: cx + dx * Math.cos(angle) - dy * Math.sin(angle),
        y: cy + dx * Math.sin(angle) + dy * Math.cos(angle),
    }
}

export const inverseRotatePoint = (px, py, cx, cy, angle) => {
    return rotatePoint(px, py, cx, cy, -angle)
}