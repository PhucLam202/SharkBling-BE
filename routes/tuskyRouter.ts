import express from "express";
import { tuskyController } from "../controllers/tuskyController.ts";

const tuskyRouter = express.Router();

// Route để lấy dữ liệu tweet
tuskyRouter.get("/vaults", tuskyController.getAllVaults);
// Routes cho files
tuskyRouter.get("/files", tuskyController.getAllFiles);
tuskyRouter.get("/files/:id/data", tuskyController.getFileData);

// tuskyRouter.get("/files/:id", tuskyController.getFileById);
export default tuskyRouter;