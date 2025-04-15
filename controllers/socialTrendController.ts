import { Request, Response } from "express";
import { db } from "../db/index.js";
import { socialTrends } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const socialTrendController = {
  getSocialTrends: async (req: Request, res: Response) => {
    try {
      const allTrends = await db.select().from(socialTrends);
      res.json(allTrends);
    } catch (error) {
      console.error("Failed to fetch social trends:", error);
      res.status(500).json({ message: "Failed to fetch social trends" });
    }
  },

  getSocialTrendsByPlatform: async (req: Request, res: Response) => {
    try {
      const platform = req.params.platform;
      const trends = await db.select().from(socialTrends).where(eq(socialTrends.platform, platform));
      
      if (!trends || trends.length === 0) {
        return res.status(404).json({ message: "No trends found for this platform" });
      }
      
      res.json(trends);
    } catch (error) {
      console.error("Failed to fetch social trends:", error);
      res.status(500).json({ message: "Failed to fetch social trends" });
    }
  }
};