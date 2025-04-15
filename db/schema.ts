import { pgTable, serial, text, timestamp, doublePrecision, integer } from "drizzle-orm/pg-core";
// import { createInsertSchema } from "drizzle-zod";

// Market schema
export const markets = pgTable("markets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), 
  description: text("description").notNull(),
  platform: text("platform").notNull(), // GitHub, LinkedIn, Farcaster, Discord
  contentUrl: text("content_url").notNull(),
  creatorAddress: text("creator_address").notNull(),
  initialPool: doublePrecision("initial_pool").notNull(),
  endDate: timestamp("end_date").notNull(),
  resolutionMethod: text("resolution_method").notNull(),
  marketFee: doublePrecision("market_fee").notNull(),
  status: text("status").notNull().default("active"), // active, ended, resolved
  result: text("result").default("pending"), // pending, yes, no
  yesPool: doublePrecision("yes_pool").notNull().default(0),
  noPool: doublePrecision("no_pool").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Prediction schema
export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull(),
  walletAddress: text("wallet_address").notNull(),
  prediction: text("prediction").notNull(), // yes, no
  amount: doublePrecision("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Social trend schema
export const socialTrends = pgTable("social_trends", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(),
  content: text("content").notNull(),
  contentUrl: text("content_url").notNull(),
  metrics: text("metrics").notNull(), // JSON string of metrics
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User schema for reputation
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  predictionScore: integer("prediction_score").notNull().default(0),
  totalPredictions: integer("total_predictions").notNull().default(0),
  correctPredictions: integer("correct_predictions").notNull().default(0),
  nftsMinted: text("nfts_minted").notNull().default("[]"), // JSON array of NFT IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
// export const insertMarketSchema = createInsertSchema(markets).omit({
//   id: true,
//   createdAt: true,
//   yesPool: true,
//   noPool: true,
//   result: true,
// });

// export const insertPredictionSchema = createInsertSchema(predictions).omit({
//   id: true,
//   createdAt: true,
// });

// export const insertSocialTrendSchema = createInsertSchema(socialTrends).omit({
//   id: true,
//   createdAt: true,
// });

export type Market = typeof markets.$inferSelect;
// export type InsertMarket = typeof insertMarketSchema._type;

export type Prediction = typeof predictions.$inferSelect;
// export type InsertPrediction = typeof insertPredictionSchema._type;

export type SocialTrend = typeof socialTrends.$inferSelect;
// export type InsertSocialTrend = typeof insertSocialTrendSchema._type;

export type User = typeof users.$inferSelect;