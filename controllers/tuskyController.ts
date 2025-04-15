import { Request, Response } from "express";
import * as tuskyService from "../services/turkyService.ts";

export const tuskyController = {
  getAllVaults: async (req: Request, res: Response) => {
    try {
      const vaults = await tuskyService.tuskyService.getVaults;
      res.status(200).json(vaults);
    } catch (error: any) {
      console.error("Error getting vaults:", error);
      res.status(500).json({ error: error.message });
    }
  },

  getAllFiles: async (req: Request, res: Response) => {
    try {
      // Lấy vaultId từ query parameters nếu có, nếu không sử dụng giá trị mặc định
      const vaultId = req.query.vaultId as string || "d87e0f75-07ca-4949-afe9-a6bb62d94382";
      const files = await tuskyService.tuskyService.getFiles(vaultId);
      res.status(200).json(files);
    } catch (error: any) {
      console.error("Error getting files:", error);
      res.status(500).json({ error: error.message });
    }
  },
  getFileData: async (req: Request, res: Response) => {
    try {
      // Sử dụng ID từ params nếu có, nếu không sử dụng giá trị mặc định
      const fileId = req.params.id || "0eccf210-49da-416d-9476-5ec70f03575b";
      const fileData = await tuskyService.tuskyService.getFileData(fileId);
      
      // Gửi dữ liệu binary về client
      res.set('Content-Type', 'application/octet-stream');
      res.send(fileData);
    } catch (error: any) {
      console.error(`Error getting file data for ${req.params.id || "0eccf210-49da-416d-9476-5ec70f03575b"}:`, error);
      res.status(500).json({ error: error.message });
    }
  }
};
