const { OpenAIEmbeddings } = require("@langchain/openai")
const { Pinecone } = require("@pinecone-database/pinecone")
const { ChatOpenAI } = require("@langchain/openai")
const path = require('path')
const dotenv = require('dotenv')
const { PineconeStore } = require("@langchain/pinecone")
const { BufferMemory } = require("langchain/memory")
const { ConversationalRetrievalQAChain } = require("langchain/chains")
const { sendStatuses } = require("../Telegram")

dotenv.config({ path: path.resolve(__dirname, "../.env") })
const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
})

const index = pc.index('coltium');

async function ask_question(question,department) {
    try {
            
        // await sendStatuses("Executing Knowledge Base with question: "+ question)
        const embeddings = new OpenAIEmbeddings({
            apiKey: process.env.API_KEY,
            model: "text-embedding-3-small",
            dimensions: 1024
        });

        // Fixed: Use pineconeIndex instead of index
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: index,  // Changed from 'index' to 'pineconeIndex'
            maxConcurrency: 5,
            namespace:department
        })

     

          const llm = new ChatOpenAI({
            modelName: "gpt-5-mini-2025-08-07", // You can also use "gpt-4.1" or "gpt-4o"
            openAIApiKey: process.env.OPENAI_API_KEY,
            temperature: 1,
        });

        const memory = new BufferMemory({
            memoryKey: "chat_history",
            returnMessages: true
        });

        const retriever = vectorStore.asRetriever({
            k: 30,
            searchType: "similarity"
        })

        const conversationChain = ConversationalRetrievalQAChain.fromLLM(
            llm,
            retriever,
            {
                memory: memory,
                // verbose: true
            }
        )

        const response = await conversationChain.call({ question })
        return response.text;


    } catch (error) {
       
        throw error;
    }
}



module.exports={ask_question}