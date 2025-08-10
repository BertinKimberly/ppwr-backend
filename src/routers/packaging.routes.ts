import { Router } from "express";
import multer from "multer";
import {
   createPackagingItem,
   getAllPackagingItems,
   getPackagingItemById,
   updatePackagingItem,
   deletePackagingItem,
   uploadPackagingDocument,
   deletePackagingDocument,
} from "../controllers/packaging.controller.js";
import { authMiddleware } from "../middlewares/index.js";

// Configure multer for file upload
const upload = multer({
   storage: multer.memoryStorage(),
   limits: {
      fileSize: 3 * 1024 * 1024, // 3MB
   },
   fileFilter: (_req, file, cb) => {
      const allowedTypes = ["application/pdf"]; // align with controller validation
      if (allowedTypes.includes(file.mimetype)) {
         cb(null, true);
      } else {
         cb(new Error("Invalid file type. Only PDF is allowed."));
      }
   },
});

const router = Router();

// Public routes
router.get("/", getAllPackagingItems);
router.get("/:id", getPackagingItemById);

// Protected routes (require authentication)
router.use(authMiddleware);

router.post("/", createPackagingItem);
router.put("/:id", updatePackagingItem);
router.delete("/:id", deletePackagingItem);

// Document routes with file upload
router.post("/:id/documents", upload.single("file"), uploadPackagingDocument);
router.delete("/documents/:documentId", deletePackagingDocument);

export default router;
