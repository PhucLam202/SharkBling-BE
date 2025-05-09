import type { Express } from "express";
import { createServer, type Server } from "http";
import xRouter from "./xRouter.js";
import walrusRouter from "./walrusRouter.js";
import grokRouter from "./grokAIRouter.js";
import suiAgentRouter from "./suiAgentRouter.js";
export async function registerRoutes(app: Express): Promise<Server> {
  // Register API routes
  app.use("/v1/twitter", xRouter);
  app.use("/v1/walrus", walrusRouter);  
  app.use("/v1/grok", grokRouter);
  app.use("/v1/sui-agent", suiAgentRouter);
  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
