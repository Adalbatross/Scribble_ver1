const mongoose = require("mongoose")

const StrokeSchema = new mongoose.Schema({
    boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Board",
        required: true
    },

    strokeId: {
        type: String,
        required: true
    },

    userId: String,

    tool: String,
    color: String,
    width: Number,
    opacity: Number,
    fill: String,
    style: String,
    rotation: Number,
    groupId: String,

    points: [{ x: Number, y: Number }]

}, { timestamps: true })

module.exports = mongoose.model("Stroke", StrokeSchema)