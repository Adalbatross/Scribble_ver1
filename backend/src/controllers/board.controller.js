const Board = require("../models/Board.model.js")
const crypto = require("crypto")

exports.createBoard = async( req, res) => {
    try {
        const roomId = crypto.randomUUID()

        const board = await Board.create({
            roomId,
            owner: req.user.userId,
            title: "Unitiled Board"
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