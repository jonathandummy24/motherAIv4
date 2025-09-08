const sql = require("mssql")
const {sqlConfig}= require("../config/index")

async function addMemory(role, message, agent, chatId){
    try {
        console.log(role);
        
        const pool = await sql.connect(sqlConfig)
        const res= await pool.request().query(`
            INSERT INTO Conversations (role, content, agent, chatId)
            VALUES ('${role}', '${message}', '${agent}', '${chatId}');
            
            `)   

        return res

    } catch (error) {
      return error.message  
    }
}

async function getMemory(chatId, agent){
    try {
           const pool =await sql.connect(sqlConfig)
        const res=await pool.request().query(`
            SELECT role,content FROM Conversations WHERE agent = '${agent}' AND chatId = '${chatId}'
            `)
            
        return res.recordset
    } catch (error) {
        
    }
}


module.exports={
    addMemory,
    getMemory
}
