import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { WalrusClient } from "@mysten/walrus";
import { AppError } from "../middlewares/e/AppError.ts";
import { ErrorCode } from "../middlewares/e/ErrorCode.ts";

class WalrusService {
  private suiClient: SuiClient;
  private walrusClient: WalrusClient;
  private keypair: Ed25519Keypair;

  constructor() {
    this.suiClient = new SuiClient({ url: getFullnodeUrl("mainnet") });
    this.walrusClient = new WalrusClient({
      network: "mainnet",
      suiClient: this.suiClient,
    });
    const mnemonic= process.env.SUI_MNEMONIC;
    this.keypair = Ed25519Keypair.deriveKeypair(mnemonic  as string);
  }

  // Chuyển đổi số bigint thành blobId dạng chuỗi
  private numToBlobId(blobIdNum: bigint): string {
    const extractedBytes: number[] = [];

    for (let i = 0; i < 32; i++) {
      extractedBytes.push(Number(blobIdNum & 0xFFn));
      blobIdNum >>= 8n;
    }

    if (blobIdNum !== 0n) {
      throw new Error("blobIdNum should be fully consumed (equal 0) after extracting bytes.");
    }

    const byteArray = new Uint8Array(extractedBytes);
    const base64 = Buffer.from(byteArray).toString('base64url');
    return base64.replace(/=+$/, '');
  }

  // Xử lý blobId dựa trên kiểu dữ liệu đầu vào
  private processBlobId(blobId: string | bigint): string {
    if (typeof blobId === 'string') {
      if (/^\d+$/.test(blobId)) {
        return this.numToBlobId(BigInt(blobId));
      }
      return blobId;
    } else if (typeof blobId === 'bigint') {
      return this.numToBlobId(blobId);
    } else {
      throw new Error("Invalid blobId type. Expected string or bigint.");
    }
  }

  async uploadBlob(data?: any, description?: string): Promise<string> {
    try {
      let fileData: Uint8Array;
      if (data) {
        if (typeof data === "string") {
          // Nếu data là string
          fileData = new TextEncoder().encode(data);
        } else if (data instanceof Uint8Array) {
          // Nếu data đã là Uint8Array
          fileData = data;
        } else {
          // Nếu data là JSON object
          fileData = new TextEncoder().encode(JSON.stringify(data));
        }
      } else {
        fileData = new TextEncoder().encode("Hello from the walrus SDK!!!\n");
      }
      
      // Chuẩn bị attributes với contentType và contentLength
      const attributes: Record<string, string> = {
        contentType: "text/plain",
        contentLength: fileData.length.toString(),
      };
      
      // Thêm description vào attributes nếu có
      if (description) {
        attributes.description = description;
      }
      
      const { blobId } = await this.walrusClient.writeBlob({
        blob: fileData,
        deletable: false,
        epochs: 3,
        signer: this.keypair,
        attributes: attributes,
      });
      
      return blobId;
    } catch (error: any) {
      throw AppError.newError500(ErrorCode.WALRUS_UPLOAD_FAILED, "WALRUS_UPLOAD_FAILED " + (error as Error).message);
    }
  }

  async ReadBlob(blobId: string | bigint): Promise<Uint8Array> {
    try {
      const processedBlobId = this.processBlobId(blobId);
      const blob = await this.walrusClient.readBlob({ blobId: processedBlobId });
      return blob;
    } catch (error: any) {
      const errorMessage = error && error.message ? error.message : "Unknown error";
      throw AppError.newError500(ErrorCode.WALRUS_BLOB_NOT_FOUND, "WALRUS_BLOB_NOT_FOUND " + errorMessage);
    }
  }

  async readBlobAsText(
    blobId: string | bigint,
    encoding: BufferEncoding = "utf-8"
  ): Promise<string> {
    try {
      const processedBlobId = this.processBlobId(blobId);
      const blob = await this.walrusClient.readBlob({blobId:processedBlobId});
      return Buffer.from(blob).toString(encoding);
    } catch (error: any) {
      const errorMessage = error && error.message ? error.message : "Unknown error";
      throw AppError.newError500(ErrorCode.FILE_DOWNLOAD_ERROR, "FILE_DOWNLOAD_ERROR " + errorMessage);
    }
  }

  //check balance
  async checkBalance(): Promise<{ suiBalance: string; walBalance: string }> {
    try {
      const address = this.keypair.toSuiAddress();
      console.log("Checking balances for address:", address);

      // Check SUI balance
      const suiCoins = await this.suiClient.getCoins({
        owner: address,
      });

      let suiTotal = BigInt(0);
      for (const coin of suiCoins.data) {
        suiTotal += BigInt(coin.balance);
      }

      // Check WAL tokens
      const walTokens = await this.suiClient.getCoins({
        owner: address,
        coinType:
          "0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL",
      });

      let walTotal = BigInt(0);
      for (const coin of walTokens.data) {
        walTotal += BigInt(coin.balance);
      }

      console.log("SUI balance:", suiTotal.toString(), "MIST");
      console.log("WAL balance:", walTotal.toString());

      return {
        suiBalance: suiTotal.toString(),
        walBalance: walTotal.toString(),
      };
    } catch (error: any) {
      throw AppError.newError500(ErrorCode.WALRUS_BALANCE_CHECK_FAILED, "WALRUS_BALANCE_CHECK_FAILED " + (error as Error).message);
    }
  }
}

export default WalrusService;
