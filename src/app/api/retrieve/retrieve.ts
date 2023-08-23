import {
  connect,
  OpenAIEmbeddingFunction,
} from 'vectordb';

const mkdirp = require('mkdirp-promise');
const fs = require("fs/promises");
const path = require("path");
const admin = require("firebase-admin");
const serviceAccount = require("@root/gcloud-admin.json"); 

if(!admin?.apps?.length){
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const bucket = admin.storage().bucket("speakwiz-app.appspot.com");

async function downloadRepo (targetFolder: string, destination: string) {
  const directoryPath = targetFolder; // Starting directory path in your Firebase Storage bucket
  const destinationPath = destination; // Local directory where files will be downloaded
  console.log('Starting download')
  try {
    const [files] = await bucket.getFiles({ prefix: directoryPath });

    const promises = [];
  
    for (const file of files) {
      const filePath = file.name;
      const destinationFile = path.join(destinationPath, filePath);
      const destinationDir = path.dirname(destinationFile);
  
      try {
        await fs.access(destinationDir); // Check if the directory exists
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          console.log(`Creating directory ${destinationDir}`);
          await fs.mkdir(destinationDir, { recursive: true });
        } else {
          console.error('Error:', error);
          return;
        }
      }
      promises.push(file.download({ destination: destinationFile }));
    }
    await Promise.all(promises);
    console.log('Downloaded All Files.')
  } catch (error) {
    console.error('Error:', error);
  }
};

export async function retrieveContext(query: string, table: string) {

  return await downloadRepo('test-lance/website-3fa194a78e194afd804e6077faf15f0abf20d10e94a0cc42a6edafeef023b00b', '/tmp/website-lancedb');

  const db = await connect('/tmp/website-lancedb')
  // You need to provide an OpenAI API key, here we read it from the OPENAI_API_KEY environment variable
  const apiKey = process.env.OPENAI_API_KEY ?? ''
  // The embedding function will create embeddings for the 'context' column
  const embedFunction = new OpenAIEmbeddingFunction('context', apiKey)
  const tbl = await db.openTable(table, embedFunction)
  console.log('Query: ', query)
  return await tbl
    .search(query)
    .select(['link', 'text', 'context'])
    .limit(3)
    .execute()
}