// import { Request, Response } from "express";
// import { db } from "../db/index.js";
// import { predictions, insertPredictionSchema } from "../db/schema.js";
// import { eq, and } from "drizzle-orm";
// import { ZodError } from "zod";
// import { fromZodError } from "zod-validation-error";

// export const predictionController = {
//   getPredictions: async (req: Request, res: Response) => {
//     try {
//       const { marketId, walletAddress } = req.query;
      
//       let query = db.select().from(predictions);
      
//       if (marketId) {
//         query = query.where(eq(predictions.marketId, Number(marketId)));
//       }
      
//       if (walletAddress) {
//         query = query.where(eq(predictions.walletAddress, String(walletAddress)));
//       }
      
//       const allPredictions = await query;
//       res.json(allPredictions);
//     } catch (error) {
//       console.error("Failed to fetch predictions:", error);
//       res.status(500).json({ message: "Failed to fetch predictions" });
//     }
//   },

//   getPredictionById: async (req: Request, res: Response) => {
//     try {
//       const predictionId = parseInt(req.params.id);
//       const prediction = await db.select().from(predictions).where(eq(predictions.id, predictionId));
      
//       if (!prediction || prediction.length === 0) {
//         return res.status(404).json({ message: "Prediction not found" });
//       }
      
//       res.json(prediction[0]);
//     } catch (error) {
//       console.error("Failed to fetch prediction:", error);
//       res.status(500).json({ message: "Failed to fetch prediction" });
//     }
//   },

//   createPrediction: async (req: Request, res: Response) => {
//     try {
//       const predictionData = insertPredictionSchema.parse(req.body);
      
//       const [newPrediction] = await db.insert(predictions).values(predictionData).returning();
      
//       res.status(201).json(newPrediction);
//     } catch (error) {
//       console.error("Failed to create prediction:", error);
      
//       if (error instanceof ZodError) {
//         return res.status(400).json({ message: fromZodError(error).message });
//       }
      
//       res.status(500).json({ message: "Failed to create prediction" });
//     }
//   }
// };