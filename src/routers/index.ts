import { Router } from "express";
import userRoutes from "./user.routes.js";
import packagingRoutes from "./packaging.routes.js";

const router = Router();

router.use("/users", userRoutes);
router.use("/packaging", packagingRoutes);

export default router;
