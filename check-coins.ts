import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import dotenv from "dotenv";

dotenv.config();

async function checkCoins() {
  try {
    // Sử dụng mainnet thay vì testnet
    const suiClient = new SuiClient({ url: getFullnodeUrl("mainnet") });
    const mnemonic = process.env.SUI_MNEMONIC;
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic as string);
    const address = keypair.toSuiAddress();
    
    console.log("Checking coins for address:", address);
    
    // Get all coins without filtering by type
    const allCoins = await suiClient.getAllCoins({
      owner: address,
    });
    
    // Group coins by type
    const coinsByType: Record<string, any[]> = {};
    for (const coin of allCoins.data) {
      if (!coinsByType[coin.coinType]) {
        coinsByType[coin.coinType] = [];
      }
      coinsByType[coin.coinType].push(coin);
    }
    
    // Print all coin types and their balances
    console.log("All coin types in wallet:");
    for (const [coinType, coins] of Object.entries(coinsByType)) {
      let total = BigInt(0);
      for (const coin of coins) {
        total += BigInt(coin.balance);
      }
      console.log(`${coinType}: ${total.toString()}`);
    }
    
    // Specifically look for WAL tokens
    console.log("\nPossible WAL tokens:");
    const walTokenType = "0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL";
    console.log(`Looking for WAL token type: ${walTokenType}`);
    
    // Check if we have any WAL tokens
    let foundWalTokens = false;
    for (const [coinType, coins] of Object.entries(coinsByType)) {
      if (coinType.toLowerCase().includes("wal")) {
        foundWalTokens = true;
        let total = BigInt(0);
        for (const coin of coins) {
          total += BigInt(coin.balance);
        }
        console.log(`${coinType}: ${total.toString()}`);
      }
    }
    
    if (!foundWalTokens) {
      console.log("No WAL tokens found in wallet.");
      console.log(`You need WAL tokens to use Walrus services. Get them from https://faucet.walrus.network/`);
    }
  } catch (error) {
    console.error("Error checking coins:", error);
  }
}

checkCoins().catch(console.error);
