import { Router } from "express";
import {
   createUser,
   loginUser,
   getAllUsers,
   updateUser,
   deleteUser,
   getUserById,
} from "../controllers/user.controller.js";
import { authMiddleware, adminMiddleware } from "../middlewares/index.js";

const router = Router();

// Public routes
router.post("/register", createUser);
router.post("/login", loginUser);

// Protected routes (require authentication)
router.use(authMiddleware);

// User-specific routes
router.get("/:userId", getUserById);
router.put("/update/:userId", updateUser);
router.delete("/:userId", deleteUser);

// Admin-only routes
router.use(adminMiddleware);
router.get("/all/admin", getAllUsers);

export default router;
