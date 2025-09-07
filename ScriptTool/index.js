const path = require("path")
const dotenv = require("dotenv")
const {SystemMessage,HumanMessage,AIMessage} =require("@langchain/core/messages")
const {ChatOpenAI} = require("@langchain/openai")
const { createFileinDateFolder, getBrandNameText } = require("../Google")

dotenv.config({path: path.resolve(__dirname, "../.env")})

 const memoryStore1 = new Map();
 const memoryStore2 = new Map();
 const memoryStore3 = new Map();
 const memoryStore4 = new Map();
 const memoryStore5 = new Map();
const memoryStore6 = new Map();
async function ask_cluade(question, sessionId = "default") {

  function getMemory(sessionId) {
    return memoryStore5.get(sessionId) || [];
  }

  function saveMemory(sessionId, messages) {
    memoryStore5.set(sessionId, messages);
  }

  const model = new ChatOpenAI({
    modelName: "gpt-5-mini-2025-08-07", // or "gpt-4.1" / "gpt-4o"
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 1,
  });

  // Load memory for this session
  let messages = getMemory(sessionId);

  // If first time, set system instruction
  if (messages.length === 0) {
    messages.push(
      new SystemMessage(
        "You are a helpful assistant, who is able to write a script to be used to make a video, return normal text and interpret the Markdown format"
      )
    );
  }

  // Add new user input
  messages.push(new HumanMessage({ content: question }));

  try {
    const response = await model.invoke(messages);

    // Save response in memory
    messages.push(response);
    saveMemory(sessionId, messages);

    // Save response to file
    await createFileinDateFolder(response.content);

    return response.content;
  } catch (error) {
    return error.message;
  }
}


async function ask_cluade1(question, sessionId = "default") {
  // In-memory store

function getMemory(sessionId) {
    return memoryStore1.get(sessionId) || [];
  }

  function saveMemory(sessionId, messages) {
    memoryStore1.set(sessionId, messages);
  }
  const model = new ChatOpenAI({
    modelName: "gpt-5-mini-2025-08-07", // or "gpt-4.1" / "gpt-4o"
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 1,
  });


  // Load previous memory
  let messages = getMemory(sessionId);

  // If first time, set system role
  if (messages.length === 0) {
    messages.push(
      new SystemMessage("You are a helpful assistant")
    );
  }

  // Add new user input
  messages.push(new HumanMessage({ content: question }));

  try {
    const response = await model.invoke(messages);

    // Save response into memory
    messages.push(response);
    saveMemory(sessionId, messages);
console.log(messages);
    return response.content;
  } catch (error) {
    return error.message;
  }
}


async function website_agent(question, sessionId = "default") {


  function getMemory(sessionId) {
    return memoryStore2.get(sessionId) || [];
  }

  function saveMemory(sessionId, messages) {
    memoryStore2.set(sessionId, messages);
  }

  const model = new ChatOpenAI({
    modelName: "gpt-5-mini-2025-08-07", // or "gpt-4.1" / "gpt-4o"
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 1,
  });

  // Load previous memory
  let messages = getMemory(sessionId);

  // If first time, set system instruction
  if (messages.length === 0) {
    messages.push(
      new SystemMessage(
        "You are a Specialized Website Creation Specialist, responsible for creating stunning websites based on user requirements"
      )
    );
  }

  // Add new user input
  messages.push(new HumanMessage({ content: question }));

  try {
    const response = await model.invoke(messages);

    // Save response into memory
    messages.push(response);
    saveMemory(sessionId, messages);

    return response.content;
  } catch (error) {
    return error.message;
  }
}



async function copyWriting_agent(question, sessionId = "default") {

  function getMemory(sessionId) {
    return memoryStore3.get(sessionId) || [];
  }

  function saveMemory(sessionId, messages) {
    memoryStore3.set(sessionId, messages);
  }

  const model = new ChatOpenAI({
    modelName: "gpt-5-mini-2025-08-07", // or "gpt-4.1" / "gpt-4o"
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 1,
  });

  const content = await getBrandNameText();

  // Load previous memory
  let messages = getMemory(sessionId);

  // If first time, set system message with brand tone
  if (messages.length === 0) {
    messages.push(
      new SystemMessage(
        `You are a Specialized Spanish Copywriting Agent who writes scripts based on brand tone: ${content}, adapting to user requirements.`
      )
    );
  }

  // Add new user input
  messages.push(new HumanMessage({ content: question }));

  try {
    const response = await model.invoke(messages);

    // Save response into memory
    messages.push(response);
    saveMemory(sessionId, messages);

    return response.content;
  } catch (error) {
    return error.message;
  }
}




async function seo_specialist(question,sessionId = "default") {


function getMemory(sessionId) {
  return memoryStore4.get(sessionId) || []
}

function saveMemory(sessionId, messages) {
  memoryStore4.set(sessionId, messages)
}

  const model = new ChatOpenAI({
    modelName: "gpt-5-mini-2025-08-07", // You can also use "gpt-4.1" or "gpt-4o"
    openAIApiKey: process.env.OPENAI_API_KEY,
   temperature: 1,
  });
  // Load previous memory
  let messages = getMemory(sessionId)

  // If first time, set system instruction
  if (messages.length === 0) {
    messages.push(
      new SystemMessage(
        "You are a Specialized SEO optimization Specialist responsible for optimizing web content to help rank in search engine based on user requirements"
      )
    )
  }

  // Add new user input
  messages.push(new HumanMessage({ content: question }))



try {
    const response = await model.invoke(messages)

    // Save response to memory
    messages.push(response)
    saveMemory(sessionId, messages)

    return response.content
    
} catch (error) {
    return error.message
}
   
}
module.exports={ask_cluade, ask_cluade1,seo_specialist, website_agent,copyWriting_agent}