import { Request, Response, NextFunction } from "express";
import { getTweetInfo } from "../services/x/xService.ts";
import { CustomExpress } from "../middlewares/app/customResponse.ts";

import GrokAIService from "../services/grokAIService.ts";
import WalrusService from "../services/walrusService.ts";

export const xController = {
  getTweetData: async (req: Request, res: Response, next: NextFunction) => {
    const appExpress = new CustomExpress(req, res, next);

    try {
      const { tweetUrl } = req.body;

      if (!tweetUrl) {
        return res.status(400).json({ message: "Tweet URL is required" });
      }

      const tweetData = await getTweetInfo(tweetUrl);
      const { display_text, author } = tweetData;
      if (!display_text || !author?.screen_name) {
        throw new Error("Missing display_text or screen_name");
      }
      console.log("tweetData",tweetData)
      // 2. Gọi GrokAI để phân tích
      const grok = new GrokAIService();
      const analysis = await grok.generateCompletion(display_text);
      // 3. Lưu lên Walrus
      const walrus = new WalrusService();
      const payload = {
        tweetUrl,
        display_text,
        screen_name: author.screen_name,
        analysis,
      };
      const blobId = await walrus.uploadBlob(
        payload,
        `Analysis for ${tweetUrl}`
      );
      // Chỉ trả về dữ liệu mà không lưu vào DB
      appExpress.response200({ blobId, analysis});
    } catch (e) {
      next(e);
    }
  },
};
