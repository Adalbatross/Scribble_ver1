const express= require("express")
const router = express.Router()

const {
    createBoard,
    getBoard
} = require("../controllers/board.controller.js")

const authMiddleware = require("../middleware/auth.middleware.js")

router.post("/", authMiddleware, createBoard)

router.get("/:roomId", getBoard)

module.exports = router