import { Request, Response, NextFunction } from "express";
import WalrusService from "../services/walrusService.ts";
import { CustomExpress } from "../middlewares/app/customResponse.ts";

class WalrusController {
  private walrusService: WalrusService;

  constructor() {
    this.walrusService = new WalrusService();
  }

  async uploadFile(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);

    try {
      const { data, description } = req.body;

      // Kiểm tra xem có dữ liệu không
      if (!data) {
        return res.status(400).json({
          success: false,
          message: "Missing data in request body",
        });
      }

      await this.walrusService.checkBalance();

      // Upload dữ liệu lên Walrus với description
      const blobId = await this.walrusService.uploadBlob(data, description);
      appExpress.response200({ blobId });
    } catch (e) {
      next(e);
    }
  }

  async downloadFile(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const blobId = req.params.blobId || (req.query.blobId as string);
      if (!blobId) {
        return res.status(400).json({ error: "Missing blobId parameter" });
      }
      const blob = await this.walrusService.readBlobAsText(blobId);
      appExpress.response200({ blob });
    } catch (e) {
      next(e);
    }
  }
  async downloadFileAsText(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const { blobId } = req.params;
      if (!blobId) {
        return res.status(400).json({ error: "Missing blobId parameter" });
      }
      const encoding = (req.query.encoding as BufferEncoding) || "utf-8";
      const textContent = await this.walrusService.readBlobAsText(
        blobId,
        encoding
      );
      res.setHeader("Content-Type", "text/plain");
      appExpress.response200({ textContent });
    } catch (e) {
      next(e);
    }
  }
}

export default WalrusController;
