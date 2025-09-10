const { tavily } = require("@tavily/core")
const path = require("path")
const dotenv = require("dotenv")
dotenv.config({path: path.resolve(__dirname, "../.env")})

const client = tavily({apiKey: process.env.TAVILY_API_KEY })


async function askTavily(question,topic = "general", maxResults = 5){
    try {
      const res = await client.search(question, {
      topic,
      max_results: maxResults,
      include_answer: true,
    });


        if(res.answer){
            return `answer ${res.answer}`
        }
        let formatted = `🔎 Search results for "${question}":\n\n`;
    res.results.forEach((r, i) => {
      formatted += `${i + 1}. ${r.title}\n${r.content}\n\n`;
    });

    return formatted.trim();
    } catch (err) {
         return `⚠ Tavily search failed: ${err.message}`;
    }
}



async function run(){
    const response= await askTavily("Nepal News today")
    console.log(response);
    
}

run()