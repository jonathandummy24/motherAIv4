const sql = require("mssql")
const {sqlConfig}= require("../config/index")

async function addMemory(role, message, agent, chatId){
    try {
        

        const pool = await sql.connect(sqlConfig)
        const res= await pool.request().query(`
            INSERT INTO Conversations (role, content, agent, chatId)
            VALUES ('${role}', '${message}', '${agent}', '${chatId}');
            
            `)   

        return res
    } catch (error) {

        console.log(error);    
      return error.message  
    }
}


async function addMemoryWeb(role, message, agent, chatId) {

    console.log(role, message, agent, chatId);
    
  try {
    const pool = await sql.connect(sqlConfig);
    const res = await pool.request()
      .input("role", sql.VarChar, role)
      .input("content", sql.NVarChar(sql.MAX), message)  // safe for long HTML/text
      .input("agent", sql.VarChar, agent)
      .input("chatId", sql.VarChar, chatId.toString())
      .query(`
        INSERT INTO Conversations (role, content, agent, chatId)
        VALUES (@role, @content, @agent, @chatId);
      `);

    return res;
  } catch (error) {
    console.log(error);
    return error.message;
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
        console.log(error);
        
        throw new Error(error)
    }
}


module.exports={
    addMemory,
    getMemory,
    addMemoryWeb
}
