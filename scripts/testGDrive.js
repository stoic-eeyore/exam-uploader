import dotenv from 'dotenv';
dotenv.config();

import pkg from 'googleapis';
const { google } = pkg;

async function testDownload() {
  const fileId = '12t7CX1NuXjDYH52-6TBXkcUqPrnZ7x9sFS2seU8-bMI';
  //const fileId = '1zBfWnCeuUyit2BJaUJopMx0ZW-6h_Fq35ikP5bh5y5M';
  
  console.log('🔄 Unpacking GOOGLE_SERVICE_ACCOUNT...');
  let credentials;
  try {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    console.log(`✅ Unpacked successfully! Email: ${credentials.client_email}`);
  } catch (err) {
    console.error(err.message);
    return;
  }

  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });
  
  console.log('\n🔄 Attempting to fetch file metadata...');
  try {
    const meta = await drive.files.get({
      fileId: fileId,
      supportsAllDrives: true,
      fields: 'id, name, mimeType',
    });
    console.log(`✅ Success! Found file: "${meta.data.name}" (${meta.data.mimeType})`);

  } catch (error) {
    console.error('❌ API Request Failed!');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      // Safely inspect the object structure or string response from Google
      if (typeof error.response.data === 'object') {
        console.error('Error Details:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Error Details:', Buffer.from(error.response.data).toString());
      }
    } else {
      console.error(error.message);
    }
  }
}

testDownload();

