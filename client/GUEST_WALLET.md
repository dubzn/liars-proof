# Guest Wallet Feature

## Overview

The Guest Wallet feature allows users to play the game without installing a wallet extension. The system automatically creates a wallet, funds it, and stores the credentials locally.

## How It Works

### 1. Wallet Generation
When a user clicks "Play as Guest":
- A new Argent wallet is generated using a random private key
- The public key is derived from the private key
- The wallet address is calculated using Argent's account contract class hash

### 2. Automatic Funding
The generated wallet address is sent to the funding API:
```
POST http://daleloco/api
Content-Type: application/json

{
  "address": "0x..."
}
```

The API responds by sending funds to the wallet address.

### 3. Local Storage
The wallet credentials are stored in localStorage:
```json
{
  "privateKey": "0x...",
  "publicKey": "0x...",
  "address": "0x...",
  "deployed": false
}
```

### 4. Wallet Usage
The wallet is used like any normal Argent wallet:
- First transaction will deploy the account contract
- Subsequent transactions execute normally
- Gas fees are paid from the funded balance

## User Flow

1. User visits login page
2. User clicks "👤 PLAY AS GUEST" button
3. System shows "CREATING GUEST WALLET" modal
4. Wallet is generated and funded
5. Success toast appears
6. User can now create/join games

## Guest Mode Indicators

When in guest mode:
- Status shows "👤 GUEST MODE" instead of wallet name
- Disconnect button clears the guest wallet from localStorage

## Technical Details

### Files

- **`utils/guestWallet.ts`**: Core wallet generation and funding logic
- **`context/starknetkit.tsx`**: Integration with StarknetKit context
- **`pages/Login.tsx`**: UI for guest wallet connection

### Functions

#### `generateGuestWallet()`
Creates a new wallet with random keypair and calculates the address.

#### `fundGuestWallet(address)`
Requests funds from the API for the given address.

#### `setupGuestWallet(provider)`
Complete flow: generate wallet, fund it, and return Account instance.

#### `loadGuestWallet()`
Loads existing guest wallet from localStorage (for session restoration).

#### `deleteGuestWallet()`
Removes guest wallet from localStorage (on disconnect).

### Context Methods

#### `connectAsGuest()`
Creates a new guest wallet or restores existing one.

#### `disconnect()`
Clears guest wallet if in guest mode, otherwise disconnects wallet connector.

## Configuration

### Argent Account Class Hash
Update this constant in `guestWallet.ts` with the correct class hash for your network:

```typescript
const ARGENT_ACCOUNT_CLASS_HASH = "0x01a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003";
```

### Funding API URL
Update this constant in `guestWallet.ts` with your API endpoint:

```typescript
const FUNDING_API_URL = "http://daleloco/api";
```

## Security Considerations

⚠️ **Important**: Guest wallets store private keys in localStorage, which is not secure for production use with real funds. This feature is intended for:

- Demo/testnet environments
- Onboarding new users
- Quick testing without wallet setup

For production mainnet, users should always use proper wallet extensions.

## Limitations

1. **No Backup**: If user clears browser data, the wallet is lost
2. **Single Device**: Wallet is tied to the browser/device
3. **Limited Funds**: Wallet starts with a fixed amount from the faucet
4. **No Recovery**: No seed phrase or recovery mechanism

## Future Improvements

- Add wallet export feature (download private key)
- Implement wallet upgrade path (convert guest wallet to full wallet)
- Add low balance warnings
- Implement multi-device sync (optional)
