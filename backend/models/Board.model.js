const mongoose = require("mongoose")

const StrokeSchema = new mongoose.Schema({
    id:String,
    userId: String,
    tool: String,
    color: String,
    width: Number,
    points: [{x:Number, y:Number}]
}, {_id: false})

const BoardSchema = new mongoose.Schema({
    _id: String,
    strokes: [StrokeSchema],
},{
    timestamps:true
})

module.exports = mongoose.model("Board", BoardSchema)