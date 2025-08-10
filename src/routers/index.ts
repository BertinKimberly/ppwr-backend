import { Router } from "express";
import userRoutes from "./user.routes";
import packagingRoutes from "./packaging.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/packaging", packagingRoutes);

export default router;
