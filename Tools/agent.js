// const path = require('path')
// const dotenv = require('dotenv')
// dotenv.config()
// const Anthropic = require("@anthropic-ai/sdk")
// const {ask_question} = require("../pinecone/index")
// const {sendStatuses} =require("../Telegram/index")
// const {ask_cluade} = require("../ScriptTool/index")
// const {generateVideo} =require("../VideoTools/index")
// dotenv.config({ path: path.resolve(__dirname, "../.env") })


// async function listDepartment(){
//     await sendStatuses("Executing List Departments..")
//     var agents = [
//         {
//             "ProjectManagement": "Handles project planning, task management, timelines, resource allocation, team coordination, lead generation, brand positioning, customer acquisition, and promotional activities,project status updates, milestone tracking, risk management, and project delivery questions",
//             "Marketing": "Answers all marketing Related question,Covers brand strategy, market research, advertising campaigns, content marketing, digital marketing, and Marketing questions", // Fixed spelling
//             "Sales": "Answers all sales Related question and Sales questions",
//             "Social": "Dedicated to social media management, content creation for social platforms, community engagement, influencer partnerships, social media analytics, posting schedules, social media advertising, and online reputation management",
//             "Health": "Answers all health Related question and health questions", // Capitalized
//             "Finance": "Answers all Finance Related question,Manages budgeting, financial planning, accounting, invoicing, expense tracking, financial reporting, cash flow management, tax planning, investment decisions, and financial compliance and Finance questions",
//         }
//     ]
//     return agents
// }

// const tools = new Map()

// function registerTool(name, func, description, parameters = {}) {
//     tools.set(name, {
//         name,
//         function: func,
//         description,
//         parameters
//     })
// }

// function getTool(name) {
//     return tools.get(name)
// }

// async function executeTool(name, args = {}) {
//     const tool = getTool(name)
//     if (!tool) {
//         throw new Error(`Tool '${name}' not found`)
//     }

//     try {
//         return await tool.function(args)
//     } catch (error) {
//         throw new Error(`Tool execution failed: ${error.message}`)
//     }
// }

// function getToolDefinitions() {
//     const definitions = []
//     for (const [name, tool] of tools) {
//         definitions.push({
//             name: tool.name,
//             description: tool.description,
//             input_schema: tool.parameters // Changed from 'parameters' to 'input_schema'
//         })
//     }
//     return definitions
// }

// // Register the ask_question tool
// registerTool(
//     'ask_question',
//     async (args) => {
//         return await ask_question(args.question, args.department)
//     },
//    "Queries the specialized knowledge database for a specific department. Use this tool when you need to answer questions that require department-specific expertise or information stored in the database",
//     {
//         type: "object",
//         properties: {
//             question: {
//                 type: 'string', // Fixed: was 'question', should be 'string'
//                 description: 'The question to ask the database'
//             },
//             department: {
//                 type: 'string',
//                  description: 'The department most relevant to the question. Choose from: ProjectManagement (for project planning, timelines, resources), Marketing (for brand strategy, campaigns, market research), Sales (for sales processes, CRM, deals, revenue), Social (for social media management, content, engagement), Health (for workplace wellness, safety, medical policies), Finance (for budgeting, accounting, financial planning)',
//                 enum: ['ProjectManagement', 'Marketing', 'Sales', 'Social', 'health', 'Finance']
//             }
//         },
//         required: ['question', 'department'] // Added required fields
//     }
// )


// registerTool(
//     'ask_cluade',
//     async (args) => {
//         return await ask_cluade(args.prompt)
//     },
//    "Takes a prompt and Generates a Script , the script will further be used to generate a video, used when user request a video ",
//     {
//         type: "object",
//         properties: {
//             prompt: {
//                 type: 'string', 
//                 description: 'The prompt to geerate a script'
//             }
//         },
//         required: ['prompt'] 
//     }
// )



// registerTool(
//     'generateVideo',
//     async (args) => {
//         return await generateVideo(args.script)
//     },
//    "Given a script its going to generate a video",
//     {
//         type: "object",
//         properties: {
//             script: {
//                 type: 'string', 
//                 description: 'The script we will use to generate a video'
//             }
//         },
//         required: ['script'] 
//     }
// )


// // Register the listDepartment tool
// registerTool(
//     'listDepartment',
//     () => listDepartment(),
//     "Returns the current list of departments and what they do",
//     {
//         type: "object",
//         properties: {},
//         required: []
//     }
// )



// const client = new Anthropic({
//     apiKey: process.env.ANTHROPIC_API_KEY,
// })

// async function invokeTool(message, maxIterations = 15) {
//     let messages = [{ role: 'user', content: message }]
//     let iteration = 0

//     while (iteration < maxIterations) {
//         iteration++


//         try {
//             const response = await client.messages.create({
//                 model: "claude-3-5-sonnet-20241022", // Fixed model name
//                 max_tokens: 1024,
//                 messages: messages,
//                 tools: getToolDefinitions()
//             })



//             // Add Claude's response to messages
//             messages.push({
//                 role: 'assistant',
//                 content: response.content
//             })
//             // Check if Claude wants to use a tool
//             const toolUse = response.content.find(c => c.type === 'tool_use')

//             if (toolUse) {
//                 const toolName = toolUse.name
//                 const toolArgs = toolUse.input

//                 // await sendStatuses(`Executing Agent: ${toolName}`)
//                 try {
//                     console.log("👉 ChatGPT requested tool:", toolName)
//                     console.log("🧾 With args:", toolArgs)
//                     const toolResult = await executeTool(toolName, toolArgs)
//                     console.log("✅ Tool result:", JSON.stringify(toolResult, null, 2))

//                     // Add tool result to messages
//                     messages.push({
//                         role: 'user',
//                         content: [{
//                             type: 'tool_result',
//                             tool_use_id: toolUse.id,
//                             content: JSON.stringify(toolResult)
//                         }]
//                     })

//                     // Continue to next iteration to let Claude process the tool result
//                     continue

//                 } catch (error) {
//                     console.error('Tool execution error:', error)

//                     // Add error result to messages
//                     messages.push({
//                         role: 'user',
//                         content: [{
//                             type: 'tool_result',
//                             tool_use_id: toolUse.id,
//                             content: `Error: ${error.message}`,
//                             is_error: true
//                         }]
//                     })
//                     continue
//                 }
//             } else {
//                 // No tool use, return Claude's final response
//                 const textResponse = response.content.find(c => c.type === 'text')
//                 return textResponse?.text || 'No response'
//             }

//         } catch (error) {
//             console.error('Claude API error:', error)
//             return `Error: ${error.message}`
//         }
//     }

//     return 'Max iterations reached'
// }


//  module.exports={invokeTool}


const path = require('path')
const dotenv = require('dotenv')
dotenv.config()
const OpenAI = require("openai")
const { ask_question } = require("../pinecone/index")
const { sendStatuses } = require("../Telegram/index")
const { ask_cluade } = require("../ScriptTool/index")
const { generateVideo } = require("../VideoTools/index")
const { getMemory, addMemory } = require('../Memory/memory')
dotenv.config({ path: path.resolve(__dirname, "../.env") })
const {tavily} = require("@tavily/core")


const client1 = tavily({apiKey: process.env.TAVILY_API_KEY })


async function askTavily(question,topic = "general", maxResults = 5){
    try {
      const res = await client1.search(question, {
      topic,
      max_results: maxResults,
      include_answer: true,
    });


        if(res.answer){
            return `${res.answer}`
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

async function listDepartment() {
    await sendStatuses("Executing List Departments..")
    var agents = [
        {
            "ProjectManagement": "Handles project planning, task management, timelines, resource allocation, team coordination, lead generation, brand positioning, customer acquisition, and promotional activities,project status updates, milestone tracking, risk management, and project delivery questions",
            "Marketing": "Answers all marketing Related question,Covers brand strategy, market research, advertising campaigns, content marketing, digital marketing, and Marketing questions",
            "Sales": "Answers all sales Related question and Sales questions",
            "Social": "Dedicated to social media management, content creation for social platforms, community engagement, influencer partnerships, social media analytics, posting schedules, social media advertising, and online reputation management",
            "Health": "Answers all health Related question and health questions",
            "Finance": "Answers all Finance Related question,Manages budgeting, financial planning, accounting, invoicing, expense tracking, financial reporting, cash flow management, tax planning, investment decisions, and financial compliance and Finance questions",
        }
    ]
    return agents
}

const tools = new Map()

function registerTool(name, func, description, parameters = {}) {
    tools.set(name, {
        name,
        function: func,
        description,
        parameters
    })
}

function getTool(name) {
    return tools.get(name)
}

async function executeTool(name, args = {}) {
    const tool = getTool(name)
    if (!tool) {
        throw new Error(`Tool '${name}' not found`)
    }

    try {
        return await tool.function(args)
    } catch (error) {
        throw new Error(`Tool execution failed: ${error.message}`)
    }
}

function getToolDefinitions() {
    const definitions = []
    for (const [name, tool] of tools) {
        definitions.push({
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }
        })
    }
    return definitions
}

// Register tools
registerTool(
    'ask_question',
    async (args) => {
        return await ask_question(args.question, args.department)
    },
    "Queries the specialized knowledge database for a specific department...",
    {
        type: "object",
        properties: {
            question: { type: "string", description: "The question to ask the database" },
            department: {
                type: "string",
                description: "Relevant department",
                enum: ['ProjectManagement', 'Marketing', 'Sales', 'Social', 'Health', 'Finance']
            }
        },
        required: ["question", "department"]
    }
)

registerTool(
    'ask_cluade',
    async (args) => {
        return await ask_cluade(args.prompt)
    },
    "Takes a prompt and generates a script (later used to generate a video)",
    {
        type: "object",
        properties: {
            prompt: { type: "string", description: "The prompt to generate a script" }
        },
        required: ["prompt"]
    }
)

registerTool(
    'askTavily',
    async (args) => {
        return await askTavily(args.question)
    },
    "Search the internet for up-to-date information, news, or factual queries",
    {
        type: "object",
        properties: {
            question: { type: "string", description: "The question to be asked" }
        },
        required: ["question"]
    }
)

registerTool(
    'generateVideo',
    async (args) => {
        return await generateVideo(args.script)
    },
    "Given a script, generates a video",
    {
        type: "object",
        properties: {
            script: { type: "string", description: "The script to generate a video" }
        },
        required: ["script"]
    }
)

registerTool(
    'listDepartment',
    () => listDepartment(),
    "Returns the current list of departments and what they do",
    {
        type: "object",
        properties: {},
        required: []
    }
)

function createSystemPrompt() {
    return {
        role: 'system',
        content: `You are a helpful AI assistant with access to specialized tools. 
        
CRITICAL: Only answer the CURRENT/LATEST user question. Do not re-answer previous questions from the conversation history.

IMPORTANT TOOL USAGE RULES:
1. For ANY business question, department inquiry, or when you need specific/current data: ALWAYS use the ask_question tool first
2. For video requests: ALWAYS use ask_cluade tool first to get script, then generateVideo tool
3. When user asks about departments: use listDepartment tool
4. Don't rely solely on memory - always use tools when appropriate
5. If you're unsure whether to use a tool, err on the side of using it

Your tools provide the most current and accurate information. Use them proactively.`
    }
}
// OpenAI client
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

async function invokeTool(message, chatId, agent, maxIterations = 15) {

    let messages = await getMemory(chatId, agent)

    console.log("Memory", messages);
    

    systemMessage =createSystemPrompt()
    // Add new user message
    messages.unshift(systemMessage)
    messages.push({ role: 'user', content: message })

    let iteration = 0

    while (iteration < maxIterations) {
        iteration++

        try {
            const response = await client.chat.completions.create({
                model: "gpt-5",
                messages,
                tools: getToolDefinitions(),
                tool_choice: "auto",
            })

            const choice = response.choices[0].message
            messages.push(choice)

            if (choice.tool_calls) {
                for (const toolCall of choice.tool_calls) {
                    const toolName = toolCall.function.name
                    const toolArgs = JSON.parse(toolCall.function.arguments)

                    try {
                        console.log("👉 ChatGPT requested tool:", toolName)
                        console.log("🧾 With args:", toolArgs)

                        const toolResult = await executeTool(toolName, toolArgs)
                        console.log("✅ Tool result:", JSON.stringify(toolResult, null, 2))
                        
                        messages.push({
                            role: "system",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(toolResult)
                        })
                        if (["askTavily", "ask_question"].includes(toolName)) {
                            const res = typeof toolResult === "string"
                                ? toolResult
                                : JSON.stringify(toolResult)

                                console.log("The Response");
                                
                                console.log(res);
                                
                                console.log("\n");
                                
                            await addMemory("system", res, agent, chatId)
                            return res
                        }
                        continue
                    } catch (error) {
                        messages.push({
                            role: "system",
                            tool_call_id: toolCall.id,
                            content: `Error: ${error.message}`
                        })
                        continue
                    }
                }
            } else {
                const res = choice.content || "No response"
                await addMemory("system", res, agent, chatId)
                return res
            }
        } catch (error) {
            console.error("OpenAI API error:", error)
            return `Error: ${error.message}`
        }
    }

    saveMemory(sessionId, messages) // 🔥 persist even if loop ends
    return "Max iterations reached"
}

module.exports = { invokeTool }
