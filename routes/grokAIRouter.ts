import express from "express";
import grokAIRouter from "../controllers/grokAIController.ts";

const GrokAIRouter = express.Router();
const grokAIController = new grokAIRouter();

// Route để lấy dữ liệu tweet
GrokAIRouter.post("/completion", (req, res, next) =>
    grokAIController.generateCompletion(req, res, next)
);
export default GrokAIRouter;
