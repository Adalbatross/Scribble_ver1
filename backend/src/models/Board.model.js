const mongoose  = require("mongoose")

const BoardSchema = new mongoose.Schema({
    title: {
        type: String,
        default: "Untitled Board"
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    roomId: {
        type: String,
        required: true,
        unique: true
    }
}, {timestamps: true})

module.exports = mongoose.model ("Board", BoardSchema)