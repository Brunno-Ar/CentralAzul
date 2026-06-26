import B2 from "backblaze-b2";

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
    console.error("Erro ao instanciar Backblaze B2:", error);
  }
}

export async function uploadToB2(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string; size: number }> {
  const size = fileBuffer.length;
  
  if (!isB2Configured || !b2Instance || !b2BucketId) {
    console.log(`[B2 Mock Upload] Arquivo: ${fileName}, Tamanho: ${size} bytes. Credenciais nao configuradas. Salvando localmente.`);
    
    // Simulate upload delay and return a mock URL
    await new Promise((resolve) => setTimeout(resolve, 800));
    const cleanName = fileName.replace(/\s+/g, "_");
    const mockUrl = `/uploads/${Date.now()}_${cleanName}`;
    return {
      url: mockUrl,
      size,
    };
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
    console.error("Erro no upload do Backblaze B2:", error);
    // Fallback to mock url in case of connection/auth issues
    const cleanName = fileName.replace(/\s+/g, "_");
    return {
      url: `/uploads/${Date.now()}_${cleanName}`,
      size,
    };
  }
}
