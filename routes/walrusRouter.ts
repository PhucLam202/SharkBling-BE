import express from "express";
import walrusRouter from "../controllers/walrusController.ts";

const WalrusRouter = express.Router();
const walrusController = new walrusRouter();

// Route để lấy dữ liệu tweet
WalrusRouter.post("/upload", (req, res, next) =>
  walrusController.uploadFile(req, res, next)
);
WalrusRouter.get("/downloadtext/:blobId", (req, res, next) =>
  walrusController.downloadFileAsText(req, res, next)
);
WalrusRouter.get("/download//:blobId", walrusController.downloadFile);

export default WalrusRouter;
