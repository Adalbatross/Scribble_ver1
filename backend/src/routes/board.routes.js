const express= require("express")
const router = express.Router()

const {
    createBoard,
    getBoard,
    getMyboards,
    renameBoard,
    deleteBoard,
    updateThumbnail
} = require("../controllers/board.controller.js")

const authMiddleware = require("../middleware/auth.middleware.js")

router.post("/", authMiddleware, createBoard)
router.put("/:roomId/thumbnail", updateThumbnail)
router.get("/my", authMiddleware, getMyboards)
router.put("/:roomId", authMiddleware, renameBoard)
router.delete("/:roomId", authMiddleware, deleteBoard)

router.get("/:roomId", getBoard)

module.exports = router