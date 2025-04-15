import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// Check if SUI_NETWORK is defined
if (!process.env.SUI_NETWORK) {
  throw new Error("SUI_NETWORK environment variable is not defined");
}
// Hàm trích xuất ID tweet từ URL Twitter/X
export function extractTweetId(tweetUrl: string): string | null {
  try {
    const regex = /\/status\/(\d+)/;
    const match = tweetUrl.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Failed to extract tweet ID:", error);
    return null;
  }
}

// Hàm gọi API Twitter để lấy thông tin tweet
export async function getTweetInfo(tweetUrl: string) {
  const tweetId = extractTweetId(tweetUrl);

  if (!tweetId) {
    throw new Error("Invalid tweet URL");
  }

  const options = {
    method: "GET",
    url: "https://twitter-api45.p.rapidapi.com/tweet.php",
    params: { id: tweetId },
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY || "",
      "x-rapidapi-host": "twitter-api45.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error("Error fetching tweet data:", error);
    throw error;``
  }
}
