# PumpBot: Solana Token Trading Bot

PumpBot is a TypeScript-based command-line tool for interacting with tokens on the PumpFun platform on the Solana blockchain. It allows users to check their wallet balance, create test tokens, buy tokens, and sell a specified amount of tokens using the `pumpdotfun-sdk`.

## Advantages of PumpBot

- **Ease of Use**: Simple command-line interface for checking balance, creating tokens, buying, and selling.
- **Customizable Sales**: Sell a specific amount of tokens or all available tokens.
- **Flexibility**: Supports both Mainnet and Devnet for testing and real-world usage.
- **Automation**: Built-in functionality to create test SPL tokens for development and testing.
- **Error Handling**: Comprehensive checks for invalid addresses, insufficient balance, and invalid amounts.
- **Extensibility**: Easily adaptable for features like automated token discovery or Jupiter API integration.

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
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the project root and add your Solana wallet private key:
   ```env
   PRIVATE_KEY=your_private_key_in_base58
   ```

   To generate a new Solana wallet:
   ```bash
   solana-keygen new
   ```

4. **(Optional) Install Solana CLI** for additional testing:
   Follow the [Solana CLI installation guide](https://docs.solana.com/cli/install-solana-cli-tools).

## Usage

PumpBot supports the following commands:

### 1. Check Wallet Balance
```bash
npx tsx pumpbot.ts balance
```
- Displays the SOL balance of your wallet.
- Example output:
  ```
  Balance for 3wRoqskFtrrbkGFXYWEYHNbEzaYifAk6GbojmEbR9iRq: 0.003061592 SOL
  ```

### 2. Create a Test SPL Token
```bash
npx tsx pumpbot.ts create-token
```
- Creates a new SPL token and associated token account (ATA) on the configured network.
- Useful for testing on Devnet.
- Example output:
  ```
  Creating new SPL token...
  Token created: <token_address>
  Associated Token Account created: <ata_address>
  ```

### 3. Buy Tokens
```bash
npx tsx pumpbot.ts buy <contract_address>
```
- Buys tokens for the specified contract address on PumpFun.
- Requires a valid Solana public key (e.g., 44 characters, base58).
- Example:
  ```bash
  npx tsx pumpbot.ts buy DnD2KXSyor8amYM7RWhzmgSCGHBsWSPkzCSw7prr
  ```
- Minimum balance: 0.0025 SOL (includes ATA creation and transaction fees).

### 4. Sell Tokens
```bash
npx tsx pumpbot.ts sell <contract_address> [amount]
```
- Sells tokens for the specified contract address.
- If `[amount]` is provided, sells only that amount; otherwise, sells all tokens.
- Example (sell 500 tokens):
  ```bash
  npx tsx pumpbot.ts sell DnD2KXSyor8amYM7RWhzmgSCGHBsWSPkzCSw7prr 500
  ```
- Example (sell all tokens):
  ```bash
  npx tsx pumpbot.ts sell DnD2KXSyor8amYM7RWhzmgSCGHBsWSPkzCSw7prr
  ```

### 5. List Available Commands
```bash
npx tsx pumpbot.ts
```
- Displays a list of available commands if no valid command is provided.

## Testing on Devnet

To test PumpBot on Solana Devnet:

1. **Update RPC URL**:
   Modify the `rpc_url` in `pumpbot.ts`:
   ```typescript
   const rpc_url = "https://api.devnet.solana.com";
   ```

2. **Request Test SOL**:
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"airdrop","params":["<your_wallet_address>", 5000000000]}' https://api.devnet.solana.com
   ```
   Or use a Devnet faucet: https://faucet.solana.com/.

3. **Run Tests**:
   - Check balance: `npx tsx pumpbot.ts balance`
   - Create a token: `npx tsx pumpbot.ts create-token`
   - Test buying/selling with the created token address.

**Note**: `pumpdotfun-sdk` is designed for Mainnet (program ID: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`). Buying/selling may not work on Devnet unless PumpFun supports it.

## Troubleshooting

- **Error: `bigint: Failed to load bindings`**:
  - Switch to Node.js v18:
    ```bash
    nvm install 18
    nvm use 18
    npm install
    ```
  - Rebuild dependencies:
    ```bash
    npm run rebuild
    npm install
    ```

- **Error: Insufficient balance**:
  - Ensure your wallet has at least 0.0025 SOL for Mainnet or request test SOL for Devnet.

- **Error: Invalid contract address**:
  - Verify the contract address on PumpFun (https://pump.fun/) or Solana Explorer (https://explorer.solana.com/).
  - Example: `DnD2KXSyor8amYM7RWhzmgSCGHBsWSPkzCSw7prr` (44 characters, no `pump` suffix).

- **Error: `TypeError: Cannot read properties of undefined (reading 'toBuffer')`**:
  - Likely due to an invalid or unsupported contract address. Use a valid PumpFun token address.

- **Error: Requested sell amount exceeds available balance**:
  - Check your token balance with:
    ```bash
    npx tsx pumpbot.ts buy <contract_address>
    ```
    Then specify a valid amount.

## Contributing

Feel free to submit issues or pull requests to enhance PumpBot. Potential improvements:
- Automated token discovery on PumpFun.
- Integration with Jupiter API for token swaps.
- Enhanced error reporting and logging.

## License

MIT License