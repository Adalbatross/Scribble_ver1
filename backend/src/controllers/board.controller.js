const Board = require("../models/Board.model.js")
const crypto = require("crypto")

exports.createBoard = async( req, res) => {
    try {
        const roomId = crypto.randomUUID()
        const {title} = req.body

        const board = await Board.create({
            roomId,
            owner: req.user.userId,
            title: title || "Untitled Board"
        })

        res.json(board)
    } catch (error) {
        console.log(error);
        res.status(500).json({message: error.message})
    }
}

exports.getBoard = async (req, res) => {
    try {
        const {roomId} = req.params

        const board = await Board.findOne({ roomId})

        if(!board) {
            return res.status(404).json({message: "Board not found"})
        }

        res.json(board)
    } catch (err){
        console.err(err)
        res.status(500).json({message: err.message})
    }
}
exports.getMyboards = async (req, res) => {
    try {
        const boards = await Board.find({ owner: req.user.userId })
        .sort({createdAt: -1 })

        res.json(boards)
    } catch (error) {
        console.error(error)
        res.status(500).json({message: error.message})
    }
}
exports.renameBoard = async (req ,res ) => {
    try {
        const { roomId } = req.params
        const { title } = req.body
        
        const board = await Board.findOneAndUpdate(
            { roomId, owner: req.user.userId },
            { title },
            { new: true }
        )

        res.json(board)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
}
exports.deleteBoard = async (req, res) => {
    try {
        const { roomId } = req.params

        if (!roomId) {
            return res.status(400).json({ message: "Invalid roomId" })
        }

        const result = await Board.deleteOne({
            roomId,
            owner: req.user.userId 
        })

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Board not found or not authorized" })
        }

        res.json({ message: "Board deleted" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message })
    }
}
exports.updateThumbnail = async (req, res) => {
    try {
        const { roomId } = req.params

        console.log("thumbnail Api hit")

        let thumbnail = null

        // Case 1: normal JSON (fetch)
        if (req.body.thumbnail) {
        thumbnail = req.body.thumbnail
        }

        // Case 2: sendBeacon (raw buffer)
        else if (req.body instanceof Buffer) {
        const parsed = JSON.parse(req.body.toString())
        thumbnail = parsed.thumbnail
        }

        if (!thumbnail) {
        return res.status(400).json({ message: "No thumbnail provided" })
        }

        await Board.findOneAndUpdate(
        { roomId },
        { thumbnail }
        )

        res.json({ message: "Thumbnail updated" })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: err.message })
    }
}