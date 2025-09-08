const path = require("path")
const dotenv = require("dotenv")
const {SystemMessage,HumanMessage,AIMessage} =require("@langchain/core/messages")
const {ChatOpenAI} = require("@langchain/openai")
const { createFileinDateFolder, getBrandNameText } = require("../Google")
const { addMemory, getMemory } = require("../Memory/memory")

dotenv.config({path: path.resolve(__dirname, "../.env")})

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

  // Load previous memory
  let messages = await getMemory(chatId,agent)

  // If first time, set system instruction
  if (messages.length === 0) {
    messages.push(
      new SystemMessage(
        "You are a Specialized Website Creation Specialist, responsible for creating stunning websites based on user requirements"
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