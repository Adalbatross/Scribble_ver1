const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require("../models/User.model.js")

exports.signup = async (req, res) => {
    try {
        const {username, password, email} = req.body

        const existing = await User.findOne({
            $or: [{email}, {username}]
        })

        if(existing) {
            return res.status(400).json({ message: "User already existing"})
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            username,
            email,
            password: hashedPassword
        })

        const token = jwt.sign(
            {userId: user._id, username: user.username},
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        )

        res.json({token, user})
    } catch (error) {
        res.status(500).json({ message: error.message})
    }
}

exports.login = async (req,res) => {
    try {
        const {username, email, password} = req.body

        const user = await User.findOne({ email })

        if(!user){
            return res.status(404).json({ message: "User not found" })
        }

        const valid = await bcrypt.compare(password, user.password)

        if(!valid){
            return res.status(400).json({message : "Invalid password"})
        }

        const token = jwt.sign(
            {userId : user._id, username: user.username },
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        )
        res.json({token, user})
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}