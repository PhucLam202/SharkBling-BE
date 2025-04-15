// import { Tusky } from "@tusky-io/ts-sdk";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// Kiểm tra nếu TUSKY_API_KEY được định nghĩa
if (!process.env.TUSKY_API_KEY) {
  throw new Error("TUSKY_API_KEY environment variable is not defined");
}
const TUSKY_API_BASE_URL = "https://api.tusky.io";

// // Khởi tạo Tusky client với API key
// const tuskyClient = new Tusky({
//     apiKey: process.env.TUSKY_API_KEY
//   });


  // Hàm để lấy danh sách vaults
// export async function getVaults() {
//     try {
//       const vaults = await tuskyClient.vault.listAll();
//       return vaults;
//     } catch (error) {
//       console.error("Error fetching vaults from Tusky:", error);
//       throw error;
//     }
//   }
  
// Cấu hình axios với headers mặc định
const tuskyAxios = axios.create({
  baseURL: TUSKY_API_BASE_URL,
  headers: {
    "Api-Key": `${process.env.TUSKY_API_KEY}`,
    "Content-Type": "application/json"
  }
});
// Hàm để lấy danh sách vaults
export const tuskyService = {
  // Lấy danh sách vaults
  getVaults: async () => {
    try {
      const { data } = await tuskyAxios.get("/vaults");
      return data;
    } catch (error) {
      console.error("Error fetching vaults from Tusky:", error);
      throw error;
    }
  },
  
  getFiles: async (vaultId = "d87e0f75-07ca-4949-afe9-a6bb62d94382") => {
    try {
      const { data } = await tuskyAxios.get("/files", {
        params: {
          vaultId: vaultId
        }
      });
      return data;
    } catch (error) {
      console.error("Error fetching files from Tusky:", error);
      throw error;
    }
  },

  getFileData: async (fileId = "0eccf210-49da-416d-9476-5ec70f03575b") => {
    try {
      const response = await tuskyAxios.get(`/files/${fileId}/data`, {
        responseType: 'arraybuffer' // Để xử lý dữ liệu binary
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching file data for ${fileId} from Tusky:`, error);
      throw error;
    }
  }

}

