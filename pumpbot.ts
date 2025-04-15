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

// RPC URL для Devnet
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
      payer, // Платник (гаманець)
      payer.publicKey, // Власник токена
      null, // Freeze authority (немає)
      DEFAULT_DECIMALS // Кількість знаків після коми
    );

    console.log(`Token created: ${mint.toBase58()}`);

    // Створюємо асоційований токен-акаунт (ATA) для гаманця
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
    // Перевірка, чи contractAddress є коректним
    if (!contractAddress || !(contractAddress instanceof PublicKey)) {
      throw new Error("Invalid contract address");
    }

    // Перевірка балансу
    const balance = await checkBalance(wallet.publicKey, sdk.connection);
    if (!balance || balance < 0.0025) {
      throw new Error("Insufficient balance. Minimum required: 0.0025 SOL (including ATA creation)");
    }

    console.log(`Attempting to buy tokens for contract: ${contractAddress.toBase58()}`);
    const buyResults = await sdk.buy(
      wallet,
      contractAddress,
      BigInt(0.00005 * LAMPORTS_PER_SOL), // 0.00005 SOL
      100n, // Slippage
      {
        unitLimit: 250000,
        unitPrice: 250000,
      }
    );

    if (buyResults.success) {
      console.log("Buy successful!");
      await printSPLBalance(sdk.connection, contractAddress, wallet.publicKey);
      console.log("Bonding curve after buy", await sdk.getBondingCurveAccount(contractAddress));
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

    const currentSPLBalance = await getSPLBalance(sdk.connection, contractAddress, wallet.publicKey);
    console.log("Current SPL Balance:", currentSPLBalance);

    if (currentSPLBalance) {
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
        await printSOLBalance(sdk.connection, wallet.publicKey, "Test Account keypair");
        await printSPLBalance(sdk.connection, contractAddress, wallet.publicKey, "After SPL sell all");
        console.log("Bonding curve after sell", await sdk.getBondingCurveAccount(contractAddress));
      } else {
        console.log("Sell failed");
      }
    }
  } catch (error) {
    console.error("Error selling tokens:", error);
  }
};

// Головна функція
const main = async () => {
  try {
    const connection = new Connection(rpc_url, { commitment: "finalized" });

    // Обробка аргументів командного рядка
    const args = process.argv.slice(2);
    if (args[0] === "balance") {
      await checkBalance(wallet.publicKey, connection);
      return;
    }

    // Логіка для покупки токенів
    const provider = getProvider();
    const sdk = new PumpFunSDK(provider);

    // Використовуємо створений токен для покупки
    await buyTokens(sdk, wallet, contractAddress);
    // Опціонально: виклик функції продажу
    // await sellTokens(sdk, wallet, contractAddress);
  } catch (error) {
    console.error("Error in main:", error);
  }
};

// Запуск програми
main().catch((err) => {
  console.error("Fatal error:", err);
});