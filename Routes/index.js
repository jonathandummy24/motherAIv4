const express= require('express')
const { registerUser, loginUser } = require('../controller/userController')
const { sendandReply, askAI } = require('../controller/chatController')

const router = express.Router()


router.post("/register", registerUser)
router.post("/login", loginUser)
router.post("/chat", askAI)
router.post("/webhook", sendandReply)

module.exports={router}