import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

// Configure AWS S3 client
const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: `https://${process.env.S3_ENDPOINT}`,
  forcePathStyle: true, // Required for Selectel S3-compatible storage
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // В Node.js окружении файл из FormData может быть File или Blob
    let fileName: string;
    let fileType: string;

    if (file instanceof Blob) {
      // Проверяем, есть ли свойство name (для File)
      fileName = (file as any).name || 'file';
      fileType = file.type || 'application/octet-stream';
    } else {
      return NextResponse.json({ error: "Invalid file format." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a unique filename
    const fileExtension = fileName.split('.').pop() || 'bin';
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `ai_knowledge_base/${uniqueFilename}`,
      Body: buffer,
      ContentType: fileType,
    };

    const uploader = new Upload({
      client: s3Client,
      params,
    });

    const data = await uploader.done();
    // For Selectel, construct the public URL using the public endpoint
    const fileUrl = `https://${process.env.S3_PUBLIC_ENDPOINT}/${params.Key}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    return NextResponse.json(
      { error: "Failed to upload file to S3." },
      { status: 500 }
    );
  }
} 