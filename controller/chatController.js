const twilio = require("twilio");
const { addMemory } = require("../Memory/memory");
const { loginUserBot, getUserDepartment } = require("./userController");
const { seo_specialist, website_agent, copyWriting_agent, ask_cluade1 } = require("../ScriptTool");
const { invokeTool } = require("../Tools/agent");
const dotenv= require('dotenv')
const path= require('path')
const fs =require('fs')

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SESSION_STATES = {
    WELCOME: 'welcome',
    AWAITING_EMAIL: 'awaiting_email',
    AWAITING_PASSWORD: 'awaiting_password',
    AUTHENTICATED: 'authenticated'
};



const loginSteps = new Map();

class SessionManager {
    static getSession(phoneNumber) {
        return loginSteps.get(phoneNumber) || {
            state: SESSION_STATES.WELCOME,
            data: {},
            attempts: 0,
            lastActivity: Date.now()
        };
    }

    static updateSession(phoneNumber, updates) {
        const session = this.getSession(phoneNumber);
        const updatedSession = {
            ...session,
            ...updates,
            lastActivity: Date.now()
        };
        loginSteps.set(phoneNumber, updatedSession);
        return updatedSession;
    }

    static resetSession(phoneNumber) {
        loginSteps.set(phoneNumber, {
            state: SESSION_STATES.AWAITING_EMAIL,
            data: {},
            attempts: 0,
            lastActivity: Date.now()
        });
    }

    static deleteSession(phoneNumber) {
        loginSteps.delete(phoneNumber);
    }

    static isAuthenticated(phoneNumber) {
        const session = this.getSession(phoneNumber);
        return session.state === SESSION_STATES.AUTHENTICATED;
    }
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    console.log("THE REGEX");
    
    const res=emailRegex.test(email);

    console.log(res);

    return res
}



async function sendandReply(req, res) {
    const from = req.body.From;
    const to = req.body.To;

    
    const message = req.body.Body?.trim() || '';
    const mediaCount = parseInt(req.body.NumMedia || '0');
    const client = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

    try {

        if (message.toLowerCase() === "start") {
            SessionManager.resetSession(from);
            responseMessage = "Welcome! Please enter your email address to log in:"
            await sendWhatsAppMessage(client, from, to, responseMessage);
            return res.send("<Response></Response>");
        }

        const session = SessionManager.getSession(from);
        switch (session.state) {
            case SESSION_STATES.WELCOME:
                SessionManager.updateSession(from, { state: SESSION_STATES.AWAITING_EMAIL })
                responseMessage = "Welcome! Please enter your email address to log in:"
                break;

            case SESSION_STATES.AWAITING_EMAIL:
                await handleEmailInput(from, message)
                return res.send("<Response></Response>")

            case SESSION_STATES.AWAITING_PASSWORD:
                await handlePasswordInput(from, message)
                return res.send("<Response></Response>");

            case SESSION_STATES.AUTHENTICATED:
                responseMessage = await handleAuthenticatedUser(from, message)
                break;
            default:
                SessionManager.resetSession(from)
                responseMessage = "Session reset. Please enter your email address:"
                break;

        }
        await sendWhatsAppMessage(client, from, to, responseMessage);
      
        const { department } = session.data;
        
        console.log(loginSteps.get(from));
        
        if(department){
await addMemory('user',message,department, from.toString())
        await addMemory('system',responseMessage,department, from.toString())
        }else{
await addMemory('user',message,"MotherAI", from.toString())
        await addMemory('system',responseMessage,"MotherAI", from.toString())
        }
        
        
        
    } catch (error) {
        console.log(error);
        
        SessionManager.resetSession(from);
        responseMessage = "⚠️ Something went wrong. Session restarted. Please enter your email to log in:";
        await sendWhatsAppMessage(client, from, to, responseMessage);
    }

    res.send("<Response></Response>");
}


async function sendVideoViaURL(to) {
    try {
        console.log("Sending video from local file");
        const client = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
        const message = await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: to,
            body: "caption",
            mediaUrl: [`https://www.youtube.com/watch?v=RlPNh_PBZb4`] // This might work for local testing
        });
        
        console.log(`Video sent successfully! Message SID: ${message.sid}`);
        return message;
        
    } catch (error) {
        console.error('Error sending video via URL:', error);
        throw error;
    }
}

async function processDepartmentMessage(phone, department, message) {
    const dept = department.toLowerCase();

    switch (dept) {
        case "seo":
            const text = await seo_specialist(message, phone.toString(), dept)
            return text;
        case "website":
            const text1 = await website_agent(message, phone.toString(), dept)
            return text1;
        case "copywriter":
            const text2 = await copyWriting_agent(message, phone.toString(), dept)
            return text2;
        case "general":
            const text3 = await ask_cluade1(message, phone.toString(), dept)
            return text3;
        case "video":
            //work on it
            // const text4 = await ask_cluade1(message, phone.toString(), dept)
            // return text4
            await sendVideoViaURL(phone)
        default:
            //Mother AI
            const text5 = await invokeTool(message, phone.toString(), 'motherAI')
            return text5
    }
}

async function handleAuthenticatedUser(from, message) {
    const session = SessionManager.getSession(from);
    const department = session.data.department;

    if (message.trim()) {
        if (department) {
            const res= await processDepartmentMessage(from, department, message)
                     
            return res
        } else {
            return await invokeTool(message, from.toString(), department)
        }
    }

}
async function handleEmailInput(phoneNumber, email) {

    
    const client = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
    const isValid=!isValidEmail(email)
    console.log(isValid);
    
    if (isValid) {
        const session = SessionManager.getSession(phoneNumber);
        session.attempts = (session.attempts || 0) + 1
        if (session.attempts >= 3) {
            SessionManager.resetSession(phoneNumber);
            await sendWhatsAppMessage(client, phoneNumber, process.env.TWILIO_WHATSAPP_NUMBER,
                "Too many invalid email attempts. Please start over by typing 'start'.");
            return;
        }

        SessionManager.updateSession(phoneNumber, { attempts: session.attempts })
        await sendWhatsAppMessage(client, phoneNumber, process.env.TWILIO_WHATSAPP_NUMBER,
            `❌ Invalid email format. Please enter a valid email (${session.attempts}/3 attempts):`);
        return;
    }
    SessionManager.updateSession(phoneNumber, {
        state: SESSION_STATES.AWAITING_PASSWORD,
        data: { email: email },
        attempts: 0
    });

    await sendWhatsAppMessage(client, phoneNumber, process.env.TWILIO_WHATSAPP_NUMBER,
        "🔐 Thank you! Now please enter your password:");
}

async function handlePasswordInput(phoneNumber, password) {

    const client = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
    const session = SessionManager.getSession(phoneNumber);
    const { email } = session.data;

    try {
        const loginResult = await loginUserBot(email, password);
        if (loginResult?.token) {
            const dept = await getUserDepartment(email)

            SessionManager.updateSession(phoneNumber, {
                state: SESSION_STATES.AUTHENTICATED,
                data: {
                    email: email,
                    department: dept,
                    loginTime: Date.now()
                },
                attempts: 0
            });
            await sendWhatsAppMessage(client, phoneNumber, process.env.TWILIO_WHATSAPP_NUMBER,
                `✅ Login successful! Welcome back, ${email}. You can now send messages or upload files.`);
        } else {
            session.attempts = (session.attempts || 0) + 1;
            if (session.attempts >= 3) {
                SessionManager.resetSession(phoneNumber);
                await sendWhatsAppMessage(client, phoneNumber, process.env.TWILIO_WHATSAPP_NUMBER,
                    "❌ Too many login attempts. Please start over by typing 'start'.");
                return;
            }
            SessionManager.updateSession(phoneNumber, { attempts: session.attempts });
            await sendWhatsAppMessage(client, phoneNumber, process.env.TWILIO_WHATSAPP_NUMBER,
                `❌ Invalid credentials. Please try again (${session.attempts}/3 attempts):`);
        }
    } catch (error) {
        console.error("Login error:", error);
        SessionManager.resetSession(phoneNumber);
        await sendWhatsAppMessage(client, phoneNumber, process.env.TWILIO_WHATSAPP_NUMBER,
            "⚠️ Login failed. Please start over by typing 'start'.");
    }
}


async function sendWhatsAppMessage(client, to, from, body) {
    try {
        const chunkSize = 1500;
        for (let i = 0; i < body.length; i += chunkSize) {
            const chunk = body.substring(i, i + chunkSize);
            await client.messages.create({
                from: from,
                to: to,
                body: chunk
            })
        }

    } catch (error) {
        console.error("Error sending WhatsApp message:", error);
        throw error;
    }
}


module.exports={
    sendandReply
}