// import { Request, Response } from "express";
// import { db } from "../db/index.js";
// // import { markets, insertMarketSchema } from "../db/schema.js";
// import { markets } from "../db/schema.js";
// import { eq } from "drizzle-orm";
// import { ZodError } from "zod";
// import { fromZodError } from "zod-validation-error";

// export const marketController = {
//   getMarkets: async (req: Request, res: Response) => {
//     try {
//       const allMarkets = await db.select().from(markets);
//       res.json(allMarkets);
//     } catch (error) {
//       console.error("Failed to fetch markets:", error);
//       res.status(500).json({ message: "Failed to fetch markets" });
//     }
//   },

//   getMarketById: async (req: Request, res: Response) => {
//     try {
//       const marketId = parseInt(req.params.id);
//       const market = await db.select().from(markets).where(eq(markets.id, marketId));
      
//       if (!market || market.length === 0) {
//         return res.status(404).json({ message: "Market not found" });
//       }
      
//       res.json(market[0]);
//     } catch (error) {
//       console.error("Failed to fetch market:", error);
//       res.status(500).json({ message: "Failed to fetch market" });
//     }
//   },

//   createMarket: async (req: Request, res: Response) => {
//     try {
//       const marketData = insertMarketSchema.parse(req.body);
      
//       // Calculate initial yes/no pools
//       const yesPool = marketData.initialPool * 0.68;
//       const noPool = marketData.initialPool * 0.32;
      
//       const [newMarket] = await db.insert(markets).values({
//         ...marketData,
//         yesPool,
//         noPool,
//       }).returning();
      
//       res.status(201).json(newMarket);
//     } catch (error) {
//       console.error("Failed to create market:", error);
      
//       if (error instanceof ZodError) {
//         return res.status(400).json({ message: fromZodError(error).message });
//       }
      
//       res.status(500).json({ message: "Failed to create market" });
//     }
//   }
// };