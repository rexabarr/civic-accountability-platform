import { Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../utils/env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function uploadImage(req: AuthRequest, res: Response) {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError(503, 'Image upload is not configured on this server');
  }
  if (!req.file) throw new AppError(400, 'No file provided');

  const secure_url = await new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'civic-accountability/proof', resource_type: 'image' }, (err, result) => {
        if (err || !result) reject(err ?? new Error('Upload failed'));
        else resolve(result.secure_url);
      })
      .end(req.file!.buffer);
  });

  res.json({ url: secure_url });
}
