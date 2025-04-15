import dotenv from "dotenv";
import { PublicKey, Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { DEFAULT_DECIMALS, PumpFunSDK } from "pumpdotfun-sdk";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { printSOLBalance, getSPLBalance, printSPLBalance } from "./util";
import bs58 from "bs58";
import { createMint, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

dotenv.config();

// Налаштування гаманця
const secretKeyBase58 = process.env.PRIVATE_KEY!;
if (!secretKeyBase58) {
  throw new Error("PRIVATE_KEY is not set in .env file");
}
const secretKey = bs58.decode(secretKeyBase58);
const wallet = Keypair.fromSecretKey(secretKey);

// RPC URL (Mainnet, для Devnet змініть на https://api.devnet.solana.com)
const rpc_url = "https://mainnet.helius-rpc.com/?api-key=d66cb9e0-a6e1-43dc-9d17-bbb40f20794d";

// Створення провайдера
const getProvider = () => {
  if (!rpc_url) {
    throw new Error("Please set RPC_URL in .env file");
  }
  const connection = new Connection(rpc_url, { commitment: "finalized" });
  const anchorWallet = new Wallet(wallet);
  return new AnchorProvider(connection, anchorWallet, { commitment: "finalized" });
};

// Функція для перевірки балансу SOL гаманця
const checkBalance = async (publicKey: PublicKey, connection: Connection) => {
  try {
    const balanceLamports = await connection.getBalance(publicKey);
    const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;
    console.log(`Balance for ${publicKey.toBase58()}: ${balanceSOL} SOL`);
    return balanceSOL;
  } catch (error) {
    console.error("Error checking balance:", error);
    return null;
  }
};

// Функція для створення тестового SPL-токена
const createToken = async (connection: Connection, payer: Keypair) => {
  try {
    console.log("Creating new SPL token...");
    const mint = await createMint(
      connection,
      payer,
      payer.publicKey,
      null,
      DEFAULT_DECIMALS
    );

    console.log(`Token created: ${mint.toBase58()}`);

    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    );

    console.log(`Associated Token Account created: ${ata.address.toBase58()}`);
    return mint;
  } catch (error) {
    console.error("Error creating token:", error);
    return null;
  }
};

// Функція для покупки токенів
const buyTokens = async (sdk: PumpFunSDK, wallet: Keypair, contractAddress: PublicKey) => {
  try {
    if (!contractAddress || !(contractAddress instanceof PublicKey)) {
      throw new Error("Invalid contract address");
    }

    const balance = await checkBalance(wallet.publicKey, sdk.connection);
    if (!balance || balance < 0.0025) {
      throw new Error("Insufficient balance. Minimum required: 0.0025 SOL (including ATA creation)");
    }

    console.log(`Attempting to buy tokens for contract: ${contractAddress.toBase58()}`);
    const buyResults = await sdk.buy(
      wallet,
      contractAddress,
      BigInt(0.00005 * LAMPORTS_PER_SOL),
      100n,
      {
        unitLimit: 250000,
        unitPrice: 250000,
      }
    );

    if (buyResults.success) {
      console.log("Buy successful!");
      await printSPLBalance(sdk.connection, contractAddress, wallet.publicKey);
      const bondingCurve = await sdk.getBondingCurveAccount(contractAddress);
      console.log("Bonding curve after buy:", bondingCurve);
      if (bondingCurve.complete) {
        console.log("Bonding curve is complete. Token has moved to DEX (e.g., Raydium).");
      } else {
        console.log("Bonding curve is still active. You can continue trading on PumpFun.");
      }
    } else {
      console.log("Buy failed");
    }
  } catch (error) {
    console.error("Error buying tokens:", error);
  }
};

// Функція для продажу токенів
const sellTokens = async (sdk: PumpFunSDK, wallet: Keypair, contractAddress: PublicKey) => {
  try {
    if (!contractAddress || !(contractAddress instanceof PublicKey)) {
      throw new Error("Invalid contract address");
    }

    const bondingCurve = await sdk.getBondingCurveAccount(contractAddress);
    if (bondingCurve.complete) {
      console.log("Warning: Bonding curve is complete. Trading may be unavailable on PumpFun. Try DEX (e.g., Raydium).");
      return;
    }

    const currentSPLBalance = await getSPLBalance(sdk.connection, contractAddress, wallet.publicKey);
    console.log("Current SPL Balance:", currentSPLBalance);

    if (currentSPLBalance) {
      console.log(`Attempting to sell tokens for contract: ${contractAddress.toBase58()}`);
      const sellResults = await sdk.sell(
        wallet,
        contractAddress,
        BigInt(currentSPLBalance * Math.pow(10, DEFAULT_DECIMALS)),
        100n,
        {
          unitLimit: 250000,
          unitPrice: 250000,
        }
      );

      if (sellResults.success) {
        console.log("Sell successful!");
        await printSOLBalance(sdk.connection, wallet.publicKey, "Test Account keypair");
        await printSPLBalance(sdk.connection, contractAddress, wallet.publicKey, "After SPL sell all");
        console.log("Bonding curve after sell:", bondingCurve);
      } else {
        console.log("Sell failed");
      }
    } else {
      console.log("No tokens to sell");
    }
  } catch (error) {
    console.error("Error selling tokens:", error);
  }
};

// Головна функція
const main = async () => {
  try {
    const connection = new Connection(rpc_url, { commitment: "finalized" });
    const provider = getProvider();
    const sdk = new PumpFunSDK(provider);

    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case "balance":
        await checkBalance(wallet.publicKey, connection);
        break;

      case "create-token":
        const newToken = await createToken(connection, wallet);
        if (newToken) {
          console.log(`Use this token address for testing: ${newToken.toBase58()}`);
        }
        break;

      case "buy":
        if (!args[1]) {
          throw new Error("Please provide a contract address: npx tsx pumpbot.ts buy <contract_address>");
        }
        let contractAddress: PublicKey;
        try {
          contractAddress = new PublicKey(args[1]);
        } catch (error) {
          throw new Error(
            "Error: Insufficient balance or not valid contract address."
          );
        }
        await buyTokens(sdk, wallet, contractAddress);
        break;

      case "sell":
        if (!args[1]) {
          throw new Error("Please provide a contract address: npx tsx pumpbot.ts sell <contract_address>");
        }
        try {
          contractAddress = new PublicKey(args[1]);
        } catch (error) {
          throw new Error(
            "Error: Insufficient balance or not valid contract address."
          );
        }
        await sellTokens(sdk, wallet, contractAddress);
        break;

      default:
        console.log(`
Available commands:
  npx tsx pumpbot.ts balance              - Check wallet balance
  npx tsx pumpbot.ts create-token         - Create a new SPL token
  npx tsx pumpbot.ts buy <contract_address> - Buy tokens for the specified contract
  npx tsx pumpbot.ts sell <contract_address> - Sell tokens for the specified contract
        `);
        break;
    }
  } catch (error) {
    console.error("Error in main:", error);
  }
};

// Запуск програми
main().catch((err) => {
  console.error("Fatal error:", err);
});