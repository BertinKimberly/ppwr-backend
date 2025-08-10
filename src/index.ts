import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import router from "./routers/index.js";
import cookieParser from "cookie-parser";
import path from "path";

dotenv.config();

const PORT = process.env.PORT || 8000;

const app = express();

// Middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routers
app.use("/api/v1/", router);

app.listen(PORT, () => {
   console.log(`🏃‍♂️ server running on port ${PORT}`);
});
