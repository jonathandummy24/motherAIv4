const path = require("path")
const dotenv = require("dotenv")
const {SystemMessage,HumanMessage,ToolMessage} =require("@langchain/core/messages")
const {ChatOpenAI} = require("@langchain/openai")
const { createFileinDateFolder, getBrandNameText } = require("../Google")
const { addMemory, getMemory, addMemoryWeb } = require("../Memory/memory")
dotenv.config({path: path.resolve(__dirname, "../.env")})
const { tavily } = require("@tavily/core")
const OpenAI = require('openai')
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY })

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})


async function web_search({ query }) {
  const apiKey = process.env.BING_API_KEY; // Or SerpAPI, Google, etc.
  const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: { "Ocp-Apim-Subscription-Key": apiKey },
  });
  const data = await res.json();

  return data.webPages?.value.map((item) => ({
    title: item.name,
    url: item.url,
    snippet: item.snippet,
  })) || [];
}
async function ask_cluade(question, chatId, agent) {
  const model = new ChatOpenAI({
    modelName: "gpt-5-mini-2025-08-07", // or "gpt-4.1" / "gpt-4o"
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 1,
  });

  // Load memory for this session
  let messages = await getMemory(chatId,agent);

  // If first time, set system instruction
  if (messages.length === 0) {
    messages.push(
      new SystemMessage(
        "You are a helpful assistant, who is able to write a script to be used to make a video, return normal text and interpret the Markdown format"
      )
    );
  }

  // Add new user input
   messages.push({ role: "user", content: question });

  try {
    const response = await model.invoke(messages);
    await addMemory("system", response.content, agent, chatId)
    return response.content;
  } catch (error) {
    return error.message;
  }
}






async function ask_cluade1(question, chatId, agent) {
  const model = new ChatOpenAI({
    modelName: "gpt-5-mini-2025-08-07", // or "gpt-4.1" / "gpt-4o"
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 1,
  });


  // Load previous memory
  let messages = await getMemory(chatId,agent);
  
  // If first time, set system role
  if (messages.length === 0) {
    messages.push(
      new SystemMessage("You are a helpful assistant")
    );
  }
  // Add new user input
  messages.push({ role: "user", content: question });

  try {
    const response = await model.invoke(messages);
    await addMemory("user", question, agent, chatId)
    await addMemory("system", response.content, agent, chatId)
    return response.content;
  } catch (error) {
    return error.message;
  }
}


async function website_agent(question, chatId, agent) {
  const model = new ChatOpenAI({
    modelName: "gpt-5-mini-2025-08-07", // or "gpt-4.1" / "gpt-4o"
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 1,
  });

  console.log("The chat ");
  console.log(chatId);
  
  
  // Load previous memory
  let messages = await getMemory(chatId.toString(),agent)

  // If first time, set system instruction
  if (messages.length === 0) {
    messages.push(
      new SystemMessage(
        "You are a Specialized Website Creation Specialist, responsible for creating stunning websites based on user requirements"
      )
    );
  }
  messages.push({ role: "user", content: question });

  try {
    const response = await model.invoke(messages);
    await addMemoryWeb("system", response.content, agent, chatId)
    // console.log(response.content);
    
    return response.content;
  } catch (error) {
    return error.message;
  }
}



async function copyWriting_agent(question,chatId, agent) {
  const model = new ChatOpenAI({
    modelName: "gpt-5-mini-2025-08-07", // or "gpt-4.1" / "gpt-4o"
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 1,
  });

  const content = await getBrandNameText();
  // Load previous memory
  let messages =  await getMemory(chatId,agent);

  // If first time, set system message with brand tone
  if (messages.length === 0) {
    messages.push(
      new SystemMessage(
        `You are a Specialized Spanish Copywriting Agent who writes scripts based on brand tone: ${content}, adapting to user requirements.`
      )
    );
  }

  // Add new user input
  messages.push({ role: "user", content: question });

  try {
    const response = await model.invoke(messages);
    await addMemory("system", response.content, agent, chatId)
    return response.content;
  } catch (error) {
    return error.message;
  }
}




async function seo_specialist(question, chatId, agent) {

  const model = new ChatOpenAI({
    modelName: "gpt-5-mini-2025-08-07", // You can also use "gpt-4.1" or "gpt-4o"
    openAIApiKey: process.env.OPENAI_API_KEY,
   temperature: 1,
  });
  // Load previous memory
  let messages = await getMemory(chatId,agent)

  // If first time, set system instruction
  if (messages.length === 0) {
    messages.push(
      new SystemMessage(
        "You are a Specialized SEO optimization Specialist responsible for optimizing web content to help rank in search engine based on user requirements"
      )
    )
  }

  // Add new user input
  messages.push({ role: "user", content: question });
try {
    const response = await model.invoke(messages)
    await addMemory("system", response.content, agent, chatId)
    return response.content
    
} catch (error) {
    return error.message
}
   
}



module.exports={ask_cluade, ask_cluade1,seo_specialist, website_agent,copyWriting_agent}