import multiparty from "multiparty";
import fs from "fs";
import mime from "mime-types";
import { mongooseConnect } from "@/lib/mongoose";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

export default async function handle(req, res) {
  try {
    await mongooseConnect();
    await isAdminRequest(req, res);

    const form = new multiparty.Form();
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    if (!files?.file?.length) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    // Temporary storage strategy: keep images directly in MongoDB as data URLs.
    const links = [];
    const allowedMimeTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);
    for (const file of files.file) {
      const filePath = file.path || file.filepath;
      const maxFileSizeBytes = 2 * 1024 * 1024;
      if (typeof file.size === "number" && file.size > maxFileSizeBytes) {
        return res
          .status(400)
          .json({ error: "Each image must be smaller than 2MB." });
      }
      const contentType =
        mime.lookup(file.originalFilename || "") ||
        mime.lookup(filePath || "") ||
        "application/octet-stream";

      if (!allowedMimeTypes.has(String(contentType))) {
        return res.status(400).json({
          error: "Only JPG, PNG, WEBP and GIF images are allowed.",
        });
      }

      const fileBuffer = fs.readFileSync(filePath);
      const base64 = fileBuffer.toString("base64");
      const dataUrl = `data:${contentType};base64,${base64}`;

      links.push(dataUrl);
    }
    return res.json({ links });
  } catch (error) {
    return res
      .status(500)
      .json({ error: error?.message || "Failed to upload file." });
  }
}

export const config = {
  api: { bodyParser: false },
};
