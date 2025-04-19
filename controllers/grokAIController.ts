import { Request, Response, NextFunction } from "express";
import GrokAIService from "../services/grokAIService.ts";
import { CustomExpress } from "../middlewares/app/customResponse.ts";

class GrokAIController {
  private grokAIService: GrokAIService;

  constructor() {
    this.grokAIService = new GrokAIService();
  }

  async generateCompletion(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);

    try {
      const { prompt, useAnalysisPrefix = true,tructured = false  } = req.body;

      if (!prompt) {
        return res.status(400).json({
          success: false,
          message: "Missing prompt in request body",
        });
      }

      const completion = await this.grokAIService.generateCompletion(prompt, useAnalysisPrefix,tructured);
      appExpress.response200({ completion });
    } catch (e) {
      next(e);
    }
  }
}

export default GrokAIController;