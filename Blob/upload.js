// const { BlobServiceClient } = require("@azure/storage-blob")
// const fs = require('fs')
// const path = require("path")



// async function uploadVideoToAzure(videoPath, blobName = null) {
//     try {

//         const connectionString = "DefaultEndpointsProtocol=https;AccountName=garageimages;AccountKey=gPuxf+12tvDahbJEg82cw6vVxEogirYUQlRixxOkg6JjM2nvPUnO02J84KYixdF7kGNKKqj8Ct+V+AStUDmSJA==;EndpointSuffix=core.windows.net"
//         const containerName = "motherai"
//         if (!videoPath) {
//             throw new Error('Missing required parameters');
//         }

//         if (!fs.existsSync(videoPath)) {
//             throw new Error(`Video file not found at path: ${videoPath}`);
//         }

//         const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
//         const containerclient = blobServiceClient.getContainerClient(containerName)

//         await containerclient.createIfNotExists({ access: 'blob' })
//         if (!blobName) {
//             const fileName = path.basename(videoPath);
//             const timestamp = new Date().getTime();
//             blobName = `${timestamp}_${fileName}`;
//         }

//         const blockBlobClient = containerclient.getBlockBlobClient(blobName)

//         const fileExtension = path.extname(videoPath).toLowerCase();
//         const contentTypeMap = {
//             '.mp4': 'video/mp4',
//             '.avi': 'video/x-msvideo',
//             '.mov': 'video/quicktime',
//             '.wmv': 'video/x-ms-wmv',
//             '.flv': 'video/x-flv',
//             '.webm': 'video/webm',
//             '.mkv': 'video/x-matroska'
//         };
//         const contentType = contentTypeMap[fileExtension] || 'application/octet-stream';
//         console.log(`Uploading video: ${videoPath}`);
//         console.log(`Blob name: ${blobName}`);

//         const uploadResponse = await blockBlobClient.uploadFile(videoPath, {
//             blobHTTPHeaders: {
//                 blobContentType: contentType
//             }
//         });

//         console.log(`Upload successful! Request ID: ${uploadResponse.requestId}`);

//         // Return the public URL
//         const publicUrl = blockBlobClient.url;
//         console.log(`Public URL: ${publicUrl}`);

//         return publicUrl;
//     } catch (error) {
//         console.error('Error uploading video to Azure:', error.message);
//         throw error;
//     }

// }


// function addDoubleSlashes(paths) {
//     return paths.replace(/\\/g, '\\\\');
// }

// const path1="C:\Users\Joe\Desktop\Coltium\motherAIV4\VideoTools\generated_videos\video_1758106560304.mp4"


// console.log(addDoubleSlashes(path1));


// // async function run() {
// //     const path2 = addDoubleSlashes(path1)
// //     console.log(path2);
    
// //     const response = await uploadVideoToAzure(path2)
// //     console.log(response);
    
// // }


// // run()

const { BlobServiceClient } = require("@azure/storage-blob");
const fs = require("fs");
const path = require("path");

async function uploadVideoToAzure(videoPath, blobName = null) {
  try {
    const connectionString =
      "DefaultEndpointsProtocol=https;AccountName=garageimages;AccountKey=gPuxf+12tvDahbJEg82cw6vVxEogirYUQlRixxOkg6JjM2nvPUnO02J84KYixdF7kGNKKqj8Ct+V+AStUDmSJA==;EndpointSuffix=core.windows.net";
    const containerName = "motherai";
    if (!videoPath) {
      throw new Error("Missing required parameters");
    }

    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found at path: ${videoPath}`);
    }

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerclient = blobServiceClient.getContainerClient(containerName);

    await containerclient.createIfNotExists({ access: "blob" });
    if (!blobName) {
      const fileName = path.basename(videoPath);
      const timestamp = new Date().getTime();
      blobName = `${timestamp}_${fileName}`;
    }

    const blockBlobClient = containerclient.getBlockBlobClient(blobName);

    const fileExtension = path.extname(videoPath).toLowerCase();
    const contentTypeMap = {
      ".mp4": "video/mp4",
      ".avi": "video/x-msvideo",
      ".mov": "video/quicktime",
      ".wmv": "video/x-ms-wmv",
      ".flv": "video/x-flv",
      ".webm": "video/webm",
      ".mkv": "video/x-matroska",
    };
    const contentType = contentTypeMap[fileExtension] || "application/octet-stream";
    console.log(`Uploading video: ${videoPath}`);
    console.log(`Blob name: ${blobName}`);

    const uploadResponse = await blockBlobClient.uploadFile(videoPath, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    });

    console.log(`Upload successful! Request ID: ${uploadResponse.requestId}`);

    // Return the public URL
    const publicUrl = blockBlobClient.url;
    console.log(`Public URL: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading video to Azure:", error.message);
    throw error;
  }
}

// const path1 = "C:/Users/Joe/Desktop/Coltium/motherAIV4/VideoTools/generated_videos/video_1758106560304.mp4";

// // Or normalize automatically (works cross-platform)
// const safePath = path.normalize(path1);

// console.log(safePath);

// // Call uploader
// uploadVideoToAzure(safePath);


module.exports={
    uploadVideoToAzure
}
