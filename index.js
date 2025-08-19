const _= require("./Telegram/index")
const express= require('express')
const { router } = require('./Routes')
const cors = require("cors")
const fs =require('fs')
const path = require('path')
const dotenv=require("dotenv")
dotenv.config()
const app= express()
app.use(express.urlencoded({ extended: false }));
app.use(cors())
app.use(express.json())

const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

app.get("/test", (req,res)=>{
    res.status(200).send("<h1> Hello There great Back up! </h1>")
})
app.use('/ai', router)
app.listen(process.env.PORT,()=>{
    console.log("App Running...",process.env.PORT);
})