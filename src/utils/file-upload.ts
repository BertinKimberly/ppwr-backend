import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs-extra";

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "packaging");
fs.ensureDirSync(UPLOAD_DIR);

// File upload configuration
export interface FileUploadOptions {
   maxSize?: number; // in bytes (default 3MB)
   allowedTypes?: string[];
}

export interface UploadedFileInfo {
   originalName: string;
   filename: string;
   path: string;
   size: number;
   mimetype: string;
}

export const uploadFile = async (
   file: Express.Multer.File,
   options: FileUploadOptions = {}
): Promise<UploadedFileInfo> => {
   const {
      maxSize = 3 * 1024 * 1024, // 3MB
      allowedTypes = ["application/pdf", "image/jpeg", "image/png"],
   } = options;

   // Validate file size
   if (file.size > maxSize) {
      throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
   }

   // Validate file type
   if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`);
   }

   // Generate unique filename
   const fileExtension = path.extname(file.originalname);
   const uniqueFilename = `${uuidv4()}${fileExtension}`;
   const uploadPath = path.join(UPLOAD_DIR, uniqueFilename);

   // Save file
   await fs.writeFile(uploadPath, file.buffer);

   return {
      originalName: file.originalname,
      filename: uniqueFilename,
      path: uploadPath,
      size: file.size,
      mimetype: file.mimetype,
   };
};

export const deleteFile = async (filePath: string): Promise<void> => {
   try {
      await fs.unlink(filePath);
   } catch (error) {
      // Ignore if file not found
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
         throw error;
      }
   }
};

export const getFileUrl = (filename: string): string => {
   // In production, this would be a full URL to the file
   return `/uploads/packaging/${filename}`;
};
