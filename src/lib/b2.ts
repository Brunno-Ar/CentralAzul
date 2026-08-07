import B2 from "backblaze-b2";
import fs from "fs/promises";
import path from "path";

const b2KeyId = process.env.B2_APPLICATION_KEY_ID;
const b2Key = process.env.B2_APPLICATION_KEY;
const b2BucketId = process.env.B2_BUCKET_ID;
const b2DownloadUrl = process.env.B2_DOWNLOAD_URL || "https://f000.backblazeb2.com/file"; // Custom or standard B2 url

let b2Instance: InstanceType<typeof B2> | null = null;
let isB2Configured = false;

if (b2KeyId && b2Key && b2BucketId) {
  try {
    b2Instance = new B2({
      applicationKeyId: b2KeyId,
      applicationKey: b2Key,
    });
    isB2Configured = true;
  } catch (error) {
    console.error("Erro ao instanciar armazenamento:", error);
  }
}

async function saveLocally(
  fileBuffer: Buffer,
  fileName: string,
  size: number
): Promise<{ url: string; size: number }> {
  const cleanName = fileName.replace(/\s+/g, "_");
  const uniqueName = `${Date.now()}_${cleanName}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, uniqueName), fileBuffer);
  } catch (err) {
    console.error("Erro ao salvar arquivo em armazenamento local:", err);
  }
  return {
    url: `/uploads/${uniqueName}`,
    size,
  };
}

export async function uploadToB2(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string; size: number }> {
  const size = fileBuffer.length;
  
  if (!isB2Configured || !b2Instance || !b2BucketId) {
    console.log(`[Upload Local] Arquivo: ${fileName}, Tamanho: ${size} bytes. Salvando em armazenamento local.`);
    return saveLocally(fileBuffer, fileName, size);
  }

  try {
    await b2Instance.authorize();
    
    const uploadUrlResponse = await b2Instance.getUploadUrl({
      bucketId: b2BucketId,
    });

    const { uploadUrl, uploadAuthToken } = uploadUrlResponse.data;

    const uniqueFileName = `${Date.now()}_${fileName.replace(/\s+/g, "_")}`;

    const uploadResponse = await b2Instance.uploadFile({
      uploadUrl,
      uploadAuthToken,
      fileName: uniqueFileName,
      data: fileBuffer,
      contentType,
    });

    const fileUrl = `${b2DownloadUrl}/${uploadResponse.data.fileName}`;
    return {
      url: fileUrl,
      size,
    };
  } catch (error) {
    console.error("Erro no upload remoto, alternando para armazenamento local:", error);
    return saveLocally(fileBuffer, fileName, size);
  }
}
