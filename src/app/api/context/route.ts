import { NextResponse } from 'next/server';

import { createEmbeddingsTable } from './insert';

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

async function uploadDirectory(directoryPath: string, destinationPath: string) {
	const files = await fs.readdir(directoryPath);
	const uploadPromises = files.map(async (file: any) => {
		const filePath = path.join(directoryPath, file);
		const fileStats = await fs.stat(filePath);

		if (fileStats.isDirectory()) {
			// Recursively upload subdirectories
			return uploadDirectory(
				filePath,
        `${destinationPath}/${file}`
			);
		} else {
			const fileData = await fs.readFile(filePath);
			const uploadPath = `${destinationPath}/${file}`;
      return bucket.upload(filePath, {
        destination: uploadPath
      })
		}
	});


	await Promise.all(uploadPromises);
}


export async function GET(req: Request){
  await uploadDirectory(`/tmp/test`, 'testfour');
  return NextResponse.json({ yes: 'no' })
}


export async function POST(req: Request) {
  const { url, pages } = await req.json()
  try {
    const name = await createEmbeddingsTable(url, pages);
    console.log(name)
    const localFolderPath = `/tmp/website-lancedb/${name}.lance`;
    console.log(localFolderPath)
    uploadDirectory(localFolderPath, `test-lance/${name}`)
    .then(() => {
      console.log('Folder upload to Firebase Storage successful');
      return NextResponse.json({ table: name })
    }).catch(() => {
      console.log('random errror')
    })
  } catch (e) {
    console.log(e)
    return NextResponse.json(e, {
      status: 400
    })
  }
}
