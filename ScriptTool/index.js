const path = require("path")
const dotenv = require("dotenv")
const {SystemMessage,HumanMessage,AIMessage} =require("@langchain/core/messages")

const {ChatAnthropic,} =require("@langchain/anthropic")
const { createFileinDateFolder, getBrandNameText } = require("../Google")

dotenv.config({path: path.resolve(__dirname, "../.env")})

async function ask_cluade(question) {

    // await sendStatuses("Executing Script Generator with question: ", question)
const model = new ChatAnthropic({
  modelName: "claude-3-7-sonnet-latest",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  maxTokens: 1024,
  temperature: 0.7,
});

const messages=[
    new SystemMessage("You are an helpful assistant, who is able to write a script to be used to make a video, return normal text and interpret the Markdown format"),
    new HumanMessage({content:question})
]


try {
    const response = await model.invoke(messages);

    await createFileinDateFolder(response.content)
        return response.content
    
} catch (error) {
   
    return error.message
}
   
}
async function ask_cluade1(question) {
const model = new ChatAnthropic({
  modelName: "claude-3-7-sonnet-latest",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  maxTokens: 1024,
  temperature: 0.7,
});

const messages=[
    new SystemMessage("You are an helpful assistant"),
    new HumanMessage({content:question})
]


try {
    const response = await model.invoke(messages);


        return response.content
    
} catch (error) {
    return error.message
}
   
}

async function website_agent(question) {
const model = new ChatAnthropic({
  modelName: "claude-3-7-sonnet-latest",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  maxTokens: 1024,
  temperature: 0.7,
});

const messages=[
    new SystemMessage("You are a Specialized Website Creation Specialist, responsible for creating stunning websites based on user requirements"),
    new HumanMessage({content:question})
]


try {
    const response = await model.invoke(messages);


        return response.content
    
} catch (error) {
    return error.message
}
   
}


async function copyWriting_agent(question) {
const model = new ChatAnthropic({
  modelName: "claude-3-7-sonnet-latest",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  maxTokens: 1024,
  temperature: 0.7,
});

const content= await getBrandNameText()

const systemMessage=`You are a Specialized Spanish  Copywriting Agent Who writes Scripts based on brand tone: ${content} on user requirements`

const messages=[
    new SystemMessage(systemMessage),
    new HumanMessage({content:question})
]


try {
    const response = await model.invoke(messages);


        return response.content
    
} catch (error) {
    return error.message
}
   
}
async function seo_specialist(question) {
const model = new ChatAnthropic({
  modelName: "claude-3-7-sonnet-latest",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  maxTokens: 1024,
  temperature: 0.7,
});

const messages=[
    new SystemMessage("You are a Specialized SEO optimization Specialist responsible for optimizing web content to help rank in search engine based on user requirements"),
    new HumanMessage({content:question})
]


try {
    const response = await model.invoke(messages);


        return response.content
    
} catch (error) {
    return error.message
}
   
}
module.exports={ask_cluade, ask_cluade1,seo_specialist, website_agent,copyWriting_agent}