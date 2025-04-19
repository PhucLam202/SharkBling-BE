import type { Express } from "express";
import { createServer, type Server } from "http";
import xRouter from "./xRouter.ts";
// import tuskyRouter from "./tuskyRouter.ts"
import walrusRouter from "./walrusRouter.ts"
import grokRouter from "./grokAIRouter.ts";
export async function registerRoutes(app: Express): Promise<Server> {
  // Register API routes

  // app.use("/api/users", userRoutes);
  app.use("/v1/twitter", xRouter );
  // app.use("/v1/tusky", tuskyRouter );
  app.use("/v1/walrus",walrusRouter );  
  app.use("/v1/grok", grokRouter );
  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });
  
  const httpServer = createServer(app);
  return httpServer;
}