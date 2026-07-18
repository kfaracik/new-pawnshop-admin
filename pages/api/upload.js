import multiparty from "multiparty";
import fs from "fs/promises";
import crypto from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mongooseConnect } from "@/lib/mongoose";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_FILES = 8;
const EXTENSIONS_BY_MIME_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const getStorageConfig = () => {
  const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT;
  const region = process.env.S3_REGION || process.env.R2_REGION || "auto";
  const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  const publicBaseUrl =
    process.env.S3_PUBLIC_BASE_URL || process.env.R2_PUBLIC_BASE_URL;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
    return null;
  }

  return {
    endpoint,
    region,
    bucket,
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ""),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };
};

const getS3Client = () => {
  const config = getStorageConfig();

  if (!config) {
    return { config: null, client: null };
  }

  return {
    config,
    client: new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: config.credentials,
      forcePathStyle: true,
    }),
  };
};

const buildObjectKey = (contentType) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const extension = EXTENSIONS_BY_MIME_TYPE[contentType] || "bin";
  return `uploads/${year}/${month}/${crypto.randomUUID()}.${extension}`;
};

const detectImageMimeType = (buffer) => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  if (
    buffer.length >= 6 &&
    (buffer.toString("ascii", 0, 6) === "GIF87a" ||
      buffer.toString("ascii", 0, 6) === "GIF89a")
  ) {
    return "image/gif";
  }

  return "";
};

const removeTempFiles = async (files) => {
  await Promise.allSettled(
    files.map((file) => {
      const filePath = file.path || file.filepath;
      return filePath ? fs.unlink(filePath) : Promise.resolve();
    })
  );
};

export default async function handle(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  let uploadedFiles = [];

  try {
    await mongooseConnect();
    if (!(await isAdminRequest(req, res))) return;

    const form = new multiparty.Form({
      maxFilesSize: MAX_FILE_SIZE_BYTES * MAX_FILES,
      maxFields: 0,
    });
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    uploadedFiles = files?.file || [];

    if (!uploadedFiles.length) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    if (uploadedFiles.length > MAX_FILES) {
      return res.status(400).json({ error: `You can upload up to ${MAX_FILES} images at once.` });
    }

    const { client, config } = getS3Client();
    const links = [];
    for (const file of uploadedFiles) {
      const filePath = file.path || file.filepath;
      if (typeof file.size === "number" && file.size > MAX_FILE_SIZE_BYTES) {
        return res
          .status(400)
          .json({ error: "Each image must be smaller than 2MB." });
      }

      const fileBuffer = await fs.readFile(filePath);
      const contentType = detectImageMimeType(fileBuffer);

      if (!contentType) {
        return res.status(400).json({
          error: "Only JPG, PNG, WEBP and GIF images are allowed.",
        });
      }

      if (!client || !config) {
        links.push(`data:${contentType};base64,${fileBuffer.toString("base64")}`);
        continue;
      }

      const key = buildObjectKey(contentType);
      const cacheControl = "public, max-age=31536000, immutable";

      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          CacheControl: cacheControl,
          Metadata: {
            originalName: encodeURIComponent(
              String(file.originalFilename || file.name || "upload")
            ),
          },
        })
      );

      links.push(`${config.publicBaseUrl}/${key}`);
    }
    return res.json({ links });
  } catch (error) {
    const message =
      error?.message === "Missing S3/R2 upload configuration."
        ? "Missing S3/R2 upload configuration."
        : "Failed to upload file.";

    return res.status(500).json({ error: message });
  } finally {
    await removeTempFiles(uploadedFiles);
  }
}

export const config = {
  api: { bodyParser: false },
};
