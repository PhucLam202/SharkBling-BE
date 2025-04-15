import { Request, Response } from "express";
import { getTweetInfo } from "../services/x/xService.ts";

export const xController = {
  getTweetData: async (req: Request, res: Response) => {
    try {
      const { tweetUrl } = req.body;  
      
      if (!tweetUrl) {
        return res.status(400).json({ message: "Tweet URL is required" });
      }
      
      const tweetData = await getTweetInfo(tweetUrl);
      
      // Chỉ trả về dữ liệu mà không lưu vào DB
      res.json(tweetData);
    } catch (error: any) {
      console.error("Failed to fetch tweet data:", error);
      res.status(500).json({ 
        message: "Failed to fetch tweet data", 
        error: error.message 
      });
    }
  }
};