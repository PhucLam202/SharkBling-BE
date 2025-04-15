import type { Express } from "express";
import { createServer, type Server } from "http";
import xRouter from "./xRouter.ts";
import tuskyRouter from "./tuskyRouter.ts"
export async function registerRoutes(app: Express): Promise<Server> {
  // Register API routes

  // app.use("/api/users", userRoutes);
  app.use("/v1/twitter", xRouter );
  app.use("/v1/tusky", tuskyRouter );

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });
  
  const httpServer = createServer(app);
  return httpServer;
}