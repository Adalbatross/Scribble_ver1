const mongoose = require("mongoose")
const PointSchema = new mongoose.Schema({
    x: Number,
    y: Number
}, {_id: false})
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

    points: [PointSchema], 

    center: {
        x: Number,
        y: Number
    },
    rectSize: {
        width: Number,
        height: Number
    },
    text: String

}, { timestamps: true })

module.exports = mongoose.model("Stroke", StrokeSchema)