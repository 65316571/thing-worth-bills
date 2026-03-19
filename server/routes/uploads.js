import crypto from "crypto";
import { Router } from "express";
import { env } from "../config/env.js";

const router = Router();

function buildUploadHost() {
  if (!env.oss.bucket || !env.oss.region) {
    return "";
  }

  return `https://${env.oss.bucket}.${env.oss.region}.aliyuncs.com`;
}

function buildPublicBaseUrl() {
  if (env.oss.publicBaseUrl) {
    return env.oss.publicBaseUrl;
  }

  return buildUploadHost();
}

function ensureOssConfigured() {
  return Boolean(
    env.oss.region
    && env.oss.bucket
    && env.oss.accessKeyId
    && env.oss.accessKeySecret,
  );
}

function buildObjectKey(fileName = "image.png") {
  const timestamp = Date.now();
  const folder = `thing-worth-bills/${new Date(timestamp).toISOString().slice(0, 10)}`;
  const rawExtension = fileName.includes(".") ? fileName.split(".").pop() : "png";
  const extension = String(rawExtension || "png").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "png";
  return `${folder}/${timestamp}-${crypto.randomUUID()}.${extension}`;
}

async function uploadBufferToOss({ buffer, key, mimeType }) {
  const host = buildUploadHost();
  const publicBaseUrl = buildPublicBaseUrl();
  const date = new Date().toUTCString();
  const canonicalResource = `/${env.oss.bucket}/${key}`;
  const contentType = mimeType || "application/octet-stream";
  const stringToSign = `PUT\n\n${contentType}\n${date}\n${canonicalResource}`;
  const signature = crypto
    .createHmac("sha1", env.oss.accessKeySecret)
    .update(stringToSign)
    .digest("base64");

  const response = await fetch(`${host}/${key}`, {
    method: "PUT",
    headers: {
      Authorization: `OSS ${env.oss.accessKeyId}:${signature}`,
      Date: date,
      "Content-Type": contentType,
    },
    body: buffer,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "上传文件到 OSS 失败");
  }

  return `${publicBaseUrl}/${key}`;
}

router.get("/uploads/policy", async (req, res) => {
  if (!ensureOssConfigured()) {
    return res.status(500).json({
      success: false,
      message: "OSS configuration is incomplete",
    });
  }

  const timestamp = Date.now();
  const expireAt = new Date(timestamp + 5 * 60 * 1000).toISOString();
  const folder = `thing-worth-bills/${new Date(timestamp).toISOString().slice(0, 10)}`;
  const extension = String(req.query.extension || "png").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "png";
  const key = `${folder}/${timestamp}-${crypto.randomUUID()}.${extension}`;
  const policy = {
    expiration: expireAt,
    conditions: [
      ["content-length-range", 0, 10 * 1024 * 1024],
      { bucket: env.oss.bucket },
      { key },
    ],
  };

  const policyBase64 = Buffer.from(JSON.stringify(policy)).toString("base64");
  const signature = crypto
    .createHmac("sha1", env.oss.accessKeySecret)
    .update(policyBase64)
    .digest("base64");
  const host = buildUploadHost();
  const publicBaseUrl = buildPublicBaseUrl();

  res.json({
    success: true,
    upload: {
      host,
      key,
      policy: policyBase64,
      signature,
      OSSAccessKeyId: env.oss.accessKeyId,
      success_action_status: "200",
      publicUrl: `${publicBaseUrl}/${key}`,
      expireAt,
      bucket: env.oss.bucket,
      region: env.oss.region,
    },
  });
});

router.post("/uploads/file", async (req, res) => {
  if (!ensureOssConfigured()) {
    return res.status(500).json({
      success: false,
      message: "OSS configuration is incomplete",
    });
  }

  const { fileName, mimeType, contentBase64 } = req.body || {};

  if (!contentBase64 || !fileName) {
    return res.status(400).json({
      success: false,
      message: "fileName and contentBase64 are required",
    });
  }

  try {
    const buffer = Buffer.from(contentBase64, "base64");

    if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "文件大小必须在 10MB 以内",
      });
    }

    const key = buildObjectKey(fileName);
    const url = await uploadBufferToOss({
      buffer,
      key,
      mimeType,
    });

    res.json({
      success: true,
      upload: {
        key,
        url,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload file",
      error: error.message,
    });
  }
});

export default router;
