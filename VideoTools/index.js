const {createWriteStream,existsSync,mkdirSync} =require("fs")
const {GoogleGenAI}= require("@google/genai")
const {Readable}= require("stream")
const path = require("path")
const dotenv= require("dotenv")
const { sendVideo } = require("../Telegram")
const { uploadVideoToDrive } = require("../Google")
dotenv.config({path:path.resolve(__dirname,"../.env")})

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const ai= new GoogleGenAI({apiKey:GEMINI_API_KEY})

const videosDir = path.join(__dirname, 'generated_videos');
if (!existsSync(videosDir)) {
    mkdirSync(videosDir);
}


async function generateVideo(prompt) {
  try {


    
    let operation = await ai.models.generateVideos({
      model: "veo-3.0-generate-preview",
      prompt: prompt,
      config: {
        personGeneration: "allow_all",
        aspectRatio: "16:9",
      },
    });

    // Wait for operation to complete
    while (!operation.done) {
     
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    }
    const videoName=`video_${Date.now()}.mp4`

    if (operation.response?.generatedVideos?.length > 0) {
      const generatedVideo = operation.response.generatedVideos[0];
      const videoPath = path.join(videosDir, videoName);
      const resp = await fetch(`${generatedVideo.video?.uri}&key=${GEMINI_API_KEY}`);
      
      if (!resp.ok) {
        throw new Error(`Failed to download video: ${resp.statusText}`);
      }
      
      const writer = createWriteStream(videoPath);
      
      // Wait for the download to complete and verify file
      await new Promise((resolve, reject) => {
        const stream = Readable.fromWeb(resp.body);
        stream.pipe(writer);
        
        writer.on('finish', () => {
          // Check if file exists and has content
          if (existsSync(videoPath)) {
            const fs = require('fs');
            const stats = fs.statSync(videoPath);
            if (stats.size > 0) {
              resolve();
            } else {
              reject(new Error("Downloaded file is empty"));
            }
          } else {
            reject(new Error("Video file was not created"));
          }
        });
        
        writer.on('error', reject);
        stream.on('error', reject);
      });
      
      const vpath = path.join(__dirname, 'generated_videos', videoName);

 
      
      await uploadVideoToDrive(vpath)
      return vpath;
    } else {
      throw new Error("No video was generated");
    }
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
}

module.exports={
    generateVideo
}