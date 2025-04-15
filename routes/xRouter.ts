import express from "express";
import { xController } from "../controllers/xController.ts";

const xRouter = express.Router();

// Route để lấy dữ liệu tweet
xRouter.post("/tweet", xController.getTweetData);

export default xRouter;