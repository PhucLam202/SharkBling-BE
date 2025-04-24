import express from "express";
import SuiAgentController from "../controllers/suiAgentController.ts";

const SuiAgentRouter = express.Router();
const suiAgentController = new SuiAgentController();

// Route for chatting with the Sui Agent
SuiAgentRouter.post("/chat", (req, res, next) =>
  suiAgentController.handleChatMessage(req, res, next)
);

export default SuiAgentRouter;