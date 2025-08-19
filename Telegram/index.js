const fs = require("fs")
const { existsSync, unlinkSync } = require('fs')
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const { invokeTool } = require("../Tools/agent")
const TelegramBot = require("node-telegram-bot-api")
const bot = new TelegramBot(process.env.TELEGRAM, { polling: true })
const { loginUserBot, getUserDepartment } = require("../controller/userController")
const { createFileinDateFolder, uploadVideoToDrive } = require('../Google/index');
const { ask_question } = require("../pinecone");
const { ask_cluade1, website_agent, seo_specialist, copyWriting_agent } = require("../ScriptTool")

const loginSteps = new Map();

let activeChatIds = new Set();
let currentChatId = null;

const LOGIN_STATES = {
  INITIAL: 'initial',
  AWAITING_EMAIL: 'awaiting_email',
  AWAITING_PASSWORD: 'awaiting_password',
  AUTHENTICATED: 'authenticated'
};


// Helper function to get or create session
function getOrCreateSession(chatId) {
  if (!loginSteps.has(chatId)) {
    loginSteps.set(chatId, {
      state: LOGIN_STATES.INITIAL,
      data: {},
      attempts: 0,
      lastActivity: Date.now()
    });
  }
  return loginSteps.get(chatId);
}

// Helper function to update session
function updateSession(chatId, updates) {
  const session = getOrCreateSession(chatId);
  const updatedSession = {
    ...session,
    ...updates,
    lastActivity: Date.now()
  };
  loginSteps.set(chatId, updatedSession);
  return updatedSession;
}

function resetSession(chatId) {
  loginSteps.set(chatId, {
    state: LOGIN_STATES.AWAITING_EMAIL,
    data: {},
    attempts: 0,
    lastActivity: Date.now()
  });
}

function cleanupOldSessions() {
  const now = Date.now();
  const SESSION_TIMEOUT = 120 * 60 * 1000; // 30 minutes

  for (const [chatId, session] of loginSteps.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      loginSteps.delete(chatId);
    }
  }
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Optional: Add a logout command
bot.onText(/\/logout/, async (msg) => {
  const chatId = msg.chat.id;
  loginSteps.delete(chatId);
  await bot.sendMessage(chatId, "👋 You have been logged out. Send any message to log in again.");
});



// Cleanup old sessions every 15 minutes
setInterval(cleanupOldSessions, 120 * 60 * 1000);


// Optional: Add a status command
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  const session = loginSteps.get(chatId);

  if (session && session.state === LOGIN_STATES.AUTHENTICATED) {
    await bot.sendMessage(chatId, `✅ You are logged in as: ${session.data.email}`);
  } else {
    await bot.sendMessage(chatId, "❌ You are not logged in. Send any message to start the login process.");
  }
});
// Enhanced message handler
bot.on('message', async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  activeChatIds.add(chatId);
  currentChatId = chatId;

  const userMessage = msg.text.trim();
  const username = msg.from?.username || chatId.toString();

  try {
    // Handle /start command - always resets the session
    if (userMessage.toLowerCase() === '/start') {
      resetSession(chatId);
      await bot.sendMessage(chatId, "👋 Welcome! Let's start fresh. Please enter your email address:");
      return;
    }

    // Get current session
    const session = getOrCreateSession(chatId);

    // Handle different states
    switch (session.state) {
      case LOGIN_STATES.INITIAL:
        // First time user - prompt for email
        updateSession(chatId, { state: LOGIN_STATES.AWAITING_EMAIL });
        await bot.sendMessage(chatId, "👋 Welcome! Please enter your email address to log in:");
        break;

      case LOGIN_STATES.AWAITING_EMAIL:
        // Validate email format
        if (!isValidEmail(userMessage)) {
          session.attempts++;
          if (session.attempts >= 3) {
            resetSession(chatId);
            await bot.sendMessage(chatId, "❌ Too many invalid attempts. Please start over with a valid email address:");
            return;
          }
          await bot.sendMessage(chatId, "❌ Please enter a valid email address:");
          return;
        }

        // Store email and move to password step
        updateSession(chatId, {
          state: LOGIN_STATES.AWAITING_PASSWORD,
          data: { email: userMessage },
          attempts: 0
        });
        await bot.sendMessage(chatId, "🔐 Great! Now please enter your password:");
        break;

      case LOGIN_STATES.AWAITING_PASSWORD:
        const { email } = session.data;
        const password = userMessage;

        // Show typing indicator
        await bot.sendChatAction(chatId, 'typing');

        try {
          const loginResult = await loginUserBot(email, password);


          if (loginResult?.token) {
            const dept = await getUserDepartment(email)
            // Successful login
            updateSession(chatId, {
              state: LOGIN_STATES.AUTHENTICATED,
              data: {
                email: email,
                loginResult: loginResult,
                loginTime: Date.now(),
                department: dept,
                chatId: chatId
              },
              attempts: 0
            });


            await bot.sendMessage(chatId, `✅ Login successful! Welcome back, ${email}. You can now chat with the bot.`);
          } else {
            // Failed login
            session.attempts++;
            if (session.attempts >= 3) {
              resetSession(chatId);
              await bot.sendMessage(chatId, "❌ Too many login attempts. Please start over by entering your email address:");
              return;
            }

            await bot.sendMessage(chatId, `❌ Invalid credentials. Please try again (${session.attempts}/3 attempts):`);
          }
        } catch (error) {

          await bot.sendMessage(chatId, "Something went wrong" + error);
          resetSession(chatId);
        }
        break;

      case LOGIN_STATES.AUTHENTICATED:
        // User is logged in - process their message
        await handleAuthenticatedMessage(chatId, userMessage, username, session);
        break;

      default:
        // Unknown state - reset
        resetSession(chatId);
        await bot.sendMessage(chatId, "👋 Welcome! Please enter your email address:");
        break;
    }

  } catch (error) {
    console.error("Error in Telegram bot:", error);

    console.error(error.message);
    // Reset session on error
    resetSession(chatId);
    await bot.sendMessage(chatId, error);
    await bot.sendMessage(chatId, "⚠️ Something went wrong. Session has been reset. Please enter your email to log in:");
  }
});

async function handleAuthenticatedMessage(chatId, userMessage, username, session) {
  try {
    const { department } = session.data;
    await bot.sendChatAction(chatId, 'typing');
    ;
    let responseMessage = ""
    if (department && department.trim().toLowerCase() === 'video') {
      responseMessage = await ask_cluade(userMessage)
      await bot.sendMessage(chatId, responseMessage, {
        parse_mode: "Markdown",
        disable_web_page_preview: true
      })
      await createFileinDateFolder(responseMessage)
      //
      statusMessage = await bot.sendMessage(chatId, "🎬 Generating your video... This may take some minutes, please wait!");
      //video

      const videoName = await generateVideo(userMessage)
      const videoPath = path.join(__dirname, 'generated_videos', videoName);
      //  const videoPath="C:\\Users\\Joe\\Desktop\\Coltium\\motherAIv3\\controllers\\generated_videos\\VID_20250719_141509_024.mp4"

      await bot.editMessageText("📤 Video ready! Uploading to Telegram...", {
        chat_id: chatId,
        message_id: statusMessage.message_id
      });

      const videoStream = fs.createReadStream(videoPath);
      await bot.sendVideo(chatId, videoStream);


      await uploadVideoToDrive(videoPath)
      await bot.deleteMessage(chatId, statusMessage.message_id);
      if (existsSync(videoPath)) {
        unlinkSync(videoPath);

      }
      return

    }
    else if (department.trim().toLowerCase() === "seo") {
      const res = await seo_specialist(userMessage)
      await bot.sendMessage(chatId, res)
      return
    }
    else if (department.trim().toLowerCase() === "website") {
      const res = await website_agent(userMessage)
      await bot.sendMessage(chatId, res)
      return
    }
    else if (department.trim().toLowerCase() === "copywriter") {
     
      
      const res = await copyWriting_agent(userMessage)
      await bot.sendMessage(chatId, res)
      return
    }

    else if (department.trim().toLowerCase() === "general") {
      const res = await ask_cluade1(userMessage)
      await bot.sendMessage(chatId, res);
      return
    }
    else if (department) {
      const res = await ask_question(userMessage, department)
      await bot.sendMessage(chatId, res);
      return
    }
    else {
      const response = await invokeTool(userMessage)

      await bot.sendMessage(chatId, response)
      return
    }

  } catch (error) {
    console.error("Error handling authenticated message:", error);

    console.error(error.message);


    await bot.sendMessage(chatId, "⚠️ Something went wrong processing your message. Please try again.");
    await bot.sendMessage(chatId, error.message)
  }
}


