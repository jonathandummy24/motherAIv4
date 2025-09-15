const { google } = require('googleapis')
const dotenv = require("dotenv")
const path = require("path")
dotenv.config({ path: path.resolve(__dirname, "../.env") })
const fs= require('fs')
const xlsx = require('xlsx')
const pdfParse = require("pdf-parse")
const { parse: csvParse } = require('csv-parse/sync');

const CLIENT_ID =process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URL = process.env.REDIRECT_URL
const REFRESH_TOKEN = process.env.REFRESH_TOKEN



 const downloadDir = path.join(process.cwd(), 'downloads');
const oauthclient = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
)

oauthclient.setCredentials({ refresh_token: REFRESH_TOKEN })


const drive = google.drive({
    version: 'v3',
    auth: oauthclient
})


async function getFolderId(folderName) {
    try {
        const response = await drive.files.list({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
            fields: 'files(id,name)'
        });

        if (response.data.files.length > 0) {
            return response.data.files[0].id;
        }
        throw new Error( folderName +' folder not found');
    } catch (error) {
        console.error('Error finding  folder:', error);
        throw error;
    }
}



async function findorCreateDateFolder(folder) {
    const parentFolderId = await getFolderId(folder)
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const folderName = dateString;

    try {
        const searchResponse = await drive.files.list({
            q: `name='${folderName}' and parents in '${parentFolderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)'
        });


        if (searchResponse.data.files && searchResponse.data.files.length > 0) {
            // Folder exists, return its ID
    
            return searchResponse.data.files[0].id;
        }

        const folderMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId]
        };

        const createResponse = await drive.files.create({
            resource: folderMetadata,
            fields: 'id, name'
        });

        return createResponse.data.id;

    } catch (error) {
        console.error('Error finding/creating date folder:', error);
    }


}



async function createFileinDateFolder(content) {
    try {
        var dateFolderId = await findorCreateDateFolder("scripts")

        const now = new Date()
        const timeString = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        fileName = `script_${timeString}.txt`; // e.g., "script_14-30-25.txt"

        const fileMetadata = {
            name: fileName,
            parents: [dateFolderId]
        };

        const media = {
            mimeType: 'text/plain',
            body: content
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink, parents'
        });

        return {
            fileId: response.data.id,
            fileName: fileName,
            dateFolderId: dateFolderId,
            webViewLink: response.data.webViewLink
        };
    } catch (error) {
        console.error('Error creating file in date folder:', error);
    }
}


async function uploadVideoToDrive(videoPath){
try {
     const fileName = path.basename(videoPath);
    const fileSize = fs.statSync(videoPath).size;
    
    const folderId = await findorCreateDateFolder('videos') 

    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };
    const media = {
      mimeType: 'video/*', // Auto-detect video MIME type
      body: fs.createReadStream(videoPath)
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,size,mimeType'
    });



} catch (error) {
     console.error('Upload failed:', error.message);
}
}



async function downloadFile(fileId, fileName) {
  const filePath = path.join(downloadDir, fileName);

  // Create the directory if it doesn't exist
  if (!fs.existsSync(downloadDir)) {
fs.mkdirSync(downloadDir, { recursive: true });
  }

  // Delete existing file
  if (fs.existsSync(filePath)) {
   
    fs.unlinkSync(filePath);
  }

  const res = await drive.files.get(
    { fileId, alt: 'media' }, 
    { responseType: 'stream' }
  );

  const dest = fs.createWriteStream(filePath);
  

  
  return new Promise((resolve, reject) => {
    res.data
      .pipe(dest)
      .on('finish', () => {
     
        resolve(filePath);
      })
      .on('error', (err) => {
        console.error("Stream error:", err);
        reject(err);
      });
    
    res.data.on('error', (err) => {
      console.error("Source stream error:", err);
      reject(err);
    });
  });
}
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const records = csvParse(fileContent, {
        columns: true, // assumes the first row is headers
        skip_empty_lines: true
      });
      resolve(JSON.stringify(records, null, 2));
    } catch (error) {
      reject(error);
    }
  });
}

async function readFileContent(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.docx':
      const docxResult = await mammoth.extractRawText({ path: filePath });
      return docxResult.value;

    case '.pdf':
      const pdfData = await pdfParse(fs.readFileSync(filePath));
      return pdfData.text;

    case '.csv':
      return await readCSV(filePath);

    case '.xlsx':
    case '.xls':
      const workbook = xlsx.readFile(filePath);
      const firstSheet = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheet]);
      return JSON.stringify(sheetData, null, 2);

    default:
      return '❌ Unsupported file type';
  }
}

async function readAllFilesInFolder(folderId) {
  let raw_text=""
  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    
    });
    const files = res.data.files;
    if (!files.length) {
     
      return;
    }

   

    for (const file of files) {
     
      const filePath = await downloadFile(file.id, file.name);      
    
      const content = await readFileContent(filePath);
      raw_text+="\n---\n"
      raw_text+= content
    }
       return raw_text
  } catch (err) {
    console.error(' Error:', err.message);
  }
}


async function getBrandNameText(){
    const id= await getFolderId("brand")
    const content= await readAllFilesInFolder(id)
    return content

}


async function findorCreateDateFolderInRoot(folderName) {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    try {
        // Search for existing folder in root
        const searchResponse = await drive.files.list({
            q: `name='${folderName}' and parents in 'root' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)'
        });

        if (searchResponse.data.files && searchResponse.data.files.length > 0) {
            // Folder exists, return its ID
            console.log(`Found existing folder: ${folderName} in root`);
            return searchResponse.data.files[0].id;
        }

        // Create new folder in root (no parents specified)
        const folderMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder'
            // Omitting parents creates folder in root
        };

        const createResponse = await drive.files.create({
            resource: folderMetadata,
            fields: 'id, name'
        });

        console.log(`Created new folder: ${folderName} in root`);
        return createResponse.data.id;

    } catch (error) {
        console.error('Error finding/creating date folder in root:', error);
        throw error;
    }
}

async  function createNewFolder(folderName){
  try {
    
    const response = await findorCreateDateFolderInRoot(folderName)

    return response
  } catch (error) {
    
  }
}
module.exports={
    createFileinDateFolder,
    uploadVideoToDrive,
    getBrandNameText,
    createNewFolder
}
