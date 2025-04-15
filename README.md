# PumpBot: Solana Token Trading Bot

PumpBot is a TypeScript-based command-line tool for interacting with tokens on the PumpFun platform on the Solana blockchain. It allows users to check their wallet balance, create test tokens, and buy or sell tokens using the `pumpdotfun-sdk`.

## Advantages of PumpBot

- **Ease of Use**: Simple command-line interface to perform key actions: checking balance, creating tokens, buying, and selling.
- **Flexibility**: Supports both Mainnet and Devnet for testing and real-world usage.
- **Automation**: Built-in functionality to create test SPL tokens, making it ideal for development and testing.
- **Error Handling**: Comprehensive error checking for invalid contract addresses, insufficient balance, and network issues.
- **Extensibility**: Easily adaptable for additional features, such as automated token discovery or integration with other APIs (e.g., Jupiter).

## Prerequisites

- **Node.js**: Version 18 or higher (recommended to avoid `bigint` warnings).
- **Solana Wallet**: A Solana wallet with a private key in base58 format.
- **Dependencies**:
  - `@solana/web3.js`
  - `pumpdotfun-sdk`
  - `@coral-xyz/anchor`
  - `@solana/spl-token`
  - `bs58`
  - `dotenv`

## Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository_url>
   cd pumpbot