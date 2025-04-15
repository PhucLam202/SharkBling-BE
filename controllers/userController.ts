import { Request, Response } from "express";
import { db } from "../db/index.js";
import { users, predictions } from "../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";

export const userController = {
  getUserByWalletAddress: async (req: Request, res: Response) => {
    try {
      const walletAddress = req.params.walletAddress;
      const user = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
      
      if (!user || user.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's predictions
      const userPredictions = await db.select().from(predictions).where(eq(predictions.walletAddress, walletAddress));
      
      res.json({
        ...user[0],
        predictions: userPredictions
      });
    } catch (error) {
      console.error("Failed to fetch user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  },

  getTopPredictors: async (req: Request, res: Response) => {
    try {
      // This is a simplified example - in a real app, you'd calculate success rate
      const topPredictors = await db
        .select({
          walletAddress: users.walletAddress,
          username: users.username,
          predictionCount: sql<number>`count(${predictions.id})`.as('predictionCount')
        })
        .from(users)
        .leftJoin(predictions, eq(users.walletAddress, predictions.walletAddress))
        .groupBy(users.walletAddress, users.username)
        .orderBy(desc(sql<number>`count(${predictions.id})`))
        .limit(10);
      
      res.json(topPredictors);
    } catch (error) {
      console.error("Failed to fetch top predictors:", error);
      res.status(500).json({ message: "Failed to fetch top predictors" });
    }
  }
};