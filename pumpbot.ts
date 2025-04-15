import dotenv from "dotenv";
import { PublicKey } from "@solana/web3.js";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { DEFAULT_DECIMALS, PumpFunSDK } from "pumpdotfun-sdk";
import { AnchorProvider, Program, Wallet, web3 } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet.js";
import { printSOLBalance, getSPLBalance, printSPLBalance } from "./util";
import bs58 from "bs58";

dotenv.config();

const secretKeyBase58 = process.env.PRIVATE_KEY!;
const secretKey = bs58.decode(secretKeyBase58);
const wallet = Keypair.fromSecretKey(secretKey);

// const KEYS_FOLDER = __dirname + "/.keys";
const SLIPPAGE_BASIS_POINTS = 100n;
const rpc_url = "https://api.mainnet-beta.solana.com";
const getProvider = () => {
  if (!rpc_url) {
    throw new Error("Please set HELIUS_RPC_URL in .env file");
  }

  const connection = new Connection(rpc_url || "");
  const wallet = new NodeWallet(new Keypair());
  return new AnchorProvider(connection, wallet, { commitment: "finalized" });
};

const buyTokens = async (sdk: PumpFunSDK, testAccount: Keypair, mint: any) => {
  const buyResults = await sdk.buy(
    testAccount,
    mint.publicKey,
    BigInt(0.0001 * LAMPORTS_PER_SOL),
    SLIPPAGE_BASIS_POINTS,
    {
      unitLimit: 250000,
      unitPrice: 250000,
    }
  );

  if (buyResults.success) {
    printSPLBalance(sdk.connection, mint.publicKey, testAccount.publicKey);
    console.log(
      "Bonding curve after buy",
      await sdk.getBondingCurveAccount(mint.publicKey)
    );
  } else {
    console.log("Buy failed");
  }
};

const sellTokens = async (sdk: PumpFunSDK, testAccount: Keypair, mint: any) => {
  const currentSPLBalance = await getSPLBalance(
    sdk.connection,
    mint.publicKey,
    testAccount.publicKey
  );
  console.log("currentSPLBalance", currentSPLBalance);

  if (currentSPLBalance) {
    const sellResults = await sdk.sell(
      testAccount,
      mint.publicKey,
      BigInt(currentSPLBalance * Math.pow(10, DEFAULT_DECIMALS)),
      SLIPPAGE_BASIS_POINTS,
      {
        unitLimit: 250000,
        unitPrice: 250000,
      }
    );

    if (sellResults.success) {
      await printSOLBalance(
        sdk.connection,
        testAccount.publicKey,
        "Test Account keypair"
      );
      printSPLBalance(
        sdk.connection,
        mint.publicKey,
        testAccount.publicKey,
        "After SPL sell all"
      );
      console.log(
        "Bonding curve after sell",
        await sdk.getBondingCurveAccount(mint.publicKey)
      );
    } else {
      console.log("Sell failed");
    }
  }
};
const mintAddress = new PublicKey(
  "5HV956n7UQT1XdJzv43fHPocest5YAmi9ipsuiJx7zt7"
);
const sdk = new PumpFunSDK();
buyTokens(sdk, wallet, mintAddress);
