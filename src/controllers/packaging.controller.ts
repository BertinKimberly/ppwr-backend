import { Request, Response } from "express";
import { AppError, handleCatchError } from "../middlewares/index.js";
import { db } from "../db/prisma.js";
import { z } from "zod";
import { uploadFile, deleteFile, getFileUrl } from "../utils/file-upload.js";

// Validation Schemas
const PackagingComponentSchema = z.object({
   name: z.string(),
   format: z.string(),
   weight: z.string(),
   volume: z.string(),
   ppwrCategory: z.string(),
   ppwrLevel: z.string(),
   quantity: z.number().int().positive(),
   supplier: z.string(),
   manufacturingProcess: z.string(),
   color: z.string(),
});

const PackagingItemSchema = z.object({
   name: z.string(),
   internalCode: z.string(),
   materials: z.array(z.string()),
   status: z
      .enum(["DRAFT", "ACTIVE", "INACTIVE", "DEACTIVATED"])
      .optional()
      .default("DRAFT"),
   weight: z.string(),
   ppwrLevel: z.string(),
   components: z.array(PackagingComponentSchema).optional(),
});

const DocumentUploadSchema = z.object({
   type: z.enum(["CONFORMITY_DECLARATION", "TECHNICAL_DOCUMENTATION"]),
   name: z.string().optional(),
});

// Create Packaging Item
export const createPackagingItem = async (
   req: Request,
   res: Response
): Promise<any> => {
   try {
      const validatedData = PackagingItemSchema.parse(req.body);

      const savedPackagingItem = await db.packagingItem.create({
         data: {
            name: validatedData.name,
            internalCode: validatedData.internalCode,
            materials: validatedData.materials,
            status: validatedData.status,
            weight: validatedData.weight,
            ppwrLevel: validatedData.ppwrLevel,
            components: validatedData.components
               ? {
                    create: validatedData.components.map((component) => ({
                       name: component.name,
                       format: component.format,
                       weight: component.weight,
                       volume: component.volume,
                       ppwrCategory: component.ppwrCategory,
                       ppwrLevel: component.ppwrLevel,
                       quantity: component.quantity,
                       supplier: component.supplier,
                       manufacturingProcess: component.manufacturingProcess,
                       color: component.color,
                    })),
                 }
               : undefined,
         },
         include: {
            components: true,
         },
      });

      return res.status(201).json({
         success: true,
         message: "Packaging item created successfully",
         data: savedPackagingItem,
      });
   } catch (error: any) {
      return handleCatchError(error, res);
   }
};

// Get All Packaging Items
export const getAllPackagingItems = async (
   _req: Request,
   res: Response
): Promise<any> => {
   try {
      const packagingItems = await db.packagingItem.findMany({
         include: {
            components: true,
            documents: true,
         },
         orderBy: {
            createdAt: "desc",
         },
      });

      return res.status(200).json({
         success: true,
         message: "Packaging items retrieved",
         data: packagingItems,
      });
   } catch (error: any) {
      return handleCatchError(error, res);
   }
};

// Get Packaging Item by ID
export const getPackagingItemById = async (
   req: Request,
   res: Response
): Promise<any> => {
   try {
      const { id } = req.params;

      const packagingItem = await db.packagingItem.findUnique({
         where: { id },
         include: {
            components: true,
            documents: true,
         },
      });

      if (!packagingItem) {
         throw new AppError("Packaging item not found", 404);
      }

      return res.status(200).json({
         success: true,
         message: "Packaging item retrieved",
         data: packagingItem,
      });
   } catch (error: any) {
      return handleCatchError(error, res);
   }
};

// Update Packaging Item
export const updatePackagingItem = async (
   req: Request,
   res: Response
): Promise<any> => {
   try {
      const { id } = req.params;
      const validatedData = PackagingItemSchema.parse(req.body);

      // First, delete existing components
      await db.packagingComponent.deleteMany({
         where: { packagingItemId: id },
      });

      const updatedPackagingItem = await db.packagingItem.update({
         where: { id },
         data: {
            name: validatedData.name,
            internalCode: validatedData.internalCode,
            materials: validatedData.materials,
            status: validatedData.status,
            weight: validatedData.weight,
            ppwrLevel: validatedData.ppwrLevel,
            components: validatedData.components
               ? {
                    create: validatedData.components.map((component) => ({
                       name: component.name,
                       format: component.format,
                       weight: component.weight,
                       volume: component.volume,
                       ppwrCategory: component.ppwrCategory,
                       ppwrLevel: component.ppwrLevel,
                       quantity: component.quantity,
                       supplier: component.supplier,
                       manufacturingProcess: component.manufacturingProcess,
                       color: component.color,
                    })),
                 }
               : undefined,
         },
         include: {
            components: true,
         },
      });

      return res.status(200).json({
         success: true,
         message: "Packaging item updated successfully",
         data: updatedPackagingItem,
      });
   } catch (error: any) {
      return handleCatchError(error, res);
   }
};

// Delete Packaging Item
export const deletePackagingItem = async (
   req: Request,
   res: Response
): Promise<any> => {
   try {
      const { id } = req.params;

      // First, find and delete associated documents
      const documents = await db.packagingDocument.findMany({
         where: { packagingItemId: id },
      });

      // Delete physical files
      for (const doc of documents) {
         try {
            await deleteFile(doc.fileUrl);
         } catch (fileError) {
            console.error(`Failed to delete file ${doc.fileUrl}:`, fileError);
         }
      }

      // Delete database records
      await db.packagingDocument.deleteMany({
         where: { packagingItemId: id },
      });

      const packagingItemExists = await db.packagingItem.findUnique({
         where: { id },
      });

      if (!packagingItemExists) {
         throw new AppError("Packaging item not found", 404);
      }

      await db.packagingItem.delete({
         where: { id },
      });

      return res.status(200).json({
         success: true,
         message: "Packaging item deleted successfully",
      });
   } catch (error: any) {
      return handleCatchError(error, res);
   }
};

// Upload Document
export const uploadPackagingDocument = async (
   req: Request,
   res: Response
): Promise<any> => {
   try {
      const { id } = req.params;

      // Validate request body
      const { type } = DocumentUploadSchema.parse(req.body);

      // Check if file exists
      if (!req.file) {
         throw new AppError("No file uploaded", 400);
      }

      // Upload file
      const uploadedFile = await uploadFile(req.file, {
         maxSize: 3 * 1024 * 1024, // 3MB
         allowedTypes: ["application/pdf"],
      });

      // Create document record in database
      const document = await db.packagingDocument.create({
         data: {
            packagingItemId: id,
            type,
            name: req.file.originalname,
            fileUrl: uploadedFile.path,
            fileSize: uploadedFile.size,
         },
      });

      return res.status(201).json({
         success: true,
         message: "Document uploaded successfully",
         data: {
            ...document,
            fileUrl: getFileUrl(uploadedFile.filename),
         },
      });
   } catch (error: any) {
      return handleCatchError(error, res);
   }
};

// Delete Document
export const deletePackagingDocument = async (
   req: Request,
   res: Response
): Promise<any> => {
   try {
      const { documentId } = req.params;

      // Find the document first
      const document = await db.packagingDocument.findUnique({
         where: { id: documentId },
      });

      if (!document) {
         throw new AppError("Document not found", 404);
      }

      // Delete physical file
      await deleteFile(document.fileUrl);

      // Delete database record
      await db.packagingDocument.delete({
         where: { id: documentId },
      });

      return res.status(200).json({
         success: true,
         message: "Document deleted successfully",
      });
   } catch (error: any) {
      return handleCatchError(error, res);
   }
};
