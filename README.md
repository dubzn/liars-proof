# Liar's Proof - Privacy-Preserving Card Game on ZStarknet

> A fully on-chain card game leveraging Zero-Knowledge Proofs for private hand commitments, built for the [Zypherpunk Hackathon](https://zypherpunk.xyz/)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![ZStarknet](https://img.shields.io/badge/ZStarknet-Deployed-success.svg)
![Noir](https://img.shields.io/badge/Noir-1.0.0--beta.5-purple.svg)
![Dojo](https://img.shields.io/badge/Dojo-1.8.0-orange.svg)

## 🎯 Overview

**Liar's Proof** is a privacy-focused, fully on-chain card game that demonstrates the power of Zero-Knowledge Proofs in gaming. Players can make claims about their cards without revealing them, and prove the validity of their claims using ZK circuits powered by Noir and Garaga.

### 🔐 Privacy First

The game showcases practical privacy-preserving gaming mechanics:
- **Private Hand Commitments**: Players commit to their cards without revealing them
- **Verifiable Claims**: Make provable statements about hidden cards using ZK proofs
- **On-Chain Verification**: All proofs verified on ZStarknet using Cairo verifier contracts
- **No Trusted Setup**: Leveraging Noir's UltraHonk proving system

## 🏗️ Architecture

### Technology Stack

- **ZK Circuit**: Noir 1.0.0-beta.5 for hand verification logic
- **Proof System**: Barretenberg UltraHonk with Starknet ZK mode
- **Verifier Generation**: Garaga 0.18.0 (Noir → Cairo contract)
- **Smart Contracts**: Cairo 2.13.1 with Dojo 1.8.0 ECS framework
- **Frontend**: React 18 + TypeScript + Vite
- **Blockchain**: Deployed on ZStarknet (Madara-based testnet)

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Player Client                            │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐    │
│  │   Hand     │─>│ Noir Circuit │─>│ Barretenberg Prover  │    │
│  │ Selection  │  │   (WASM)     │  │    (UltraHonk)       │    │
│  └────────────┘  └─────────────┘  └──────────────────────┘    │
│                                              │                   │
│                                              ▼                   │
│                                    ┌──────────────────┐         │
│                                    │  Garaga Calldata │         │
│                                    │    Formatter     │         │
│                                    └──────────────────┘         │
└────────────────────────────────────────────┬────────────────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ZStarknet                                │
│  ┌────────────────┐         ┌──────────────────────────┐       │
│  │  Dojo World    │         │   Garaga Verifier        │       │
│  │  (Game Logic)  │◄────────│  (Cairo Contract)        │       │
│  │                │         │                          │       │
│  │ • Game State   │         │ • UltraHonk Verification │       │
│  │ • Player Turns │         │ • Starknet ZK Mode       │       │
│  │ • Commitments  │         │ • Public Input Checking  │       │
│  └────────────────┘         └──────────────────────────┘       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Torii Indexer (GraphQL)                     │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🎮 Game Flow

### Phase 1: Setup & Hand Commitment

```
Player A                           Player B
   │                                  │
   ├──> Select Cards (Private)        │
   │                                  │
   ├──> Generate ZK Proof             │
   │    • Input: hand + commitment    │
   │    • Noir Circuit Execution      │
   │    • Barretenberg Proving        │
   │                                  │
   ├──> Submit Commitment ────────────┼──> Smart Contract
   │    (Proof + Public Inputs)       │    • Verify with Garaga
   │                                  │    • Store Commitment
   │                                  │
   │    ◄──────────────────────────── ├─── Select Cards (Private)
   │                                  │
   │                                  ├──> Generate ZK Proof
   │                                  │
Smart Contract ◄────────────────────── ├─── Submit Commitment
   │                                  │
   └──> Both Committed ───────────────┘
```

### Phase 2: Condition & Challenge

```
┌─────────────────────────────────────────────────────────────┐
│                    Condition Phase                          │
│                                                             │
│  Random Condition Generated:                                │
│  "Prove you have a card with Suit=HEARTS and Value >= 10"  │
│                                                             │
│  Both players submit ZK proofs showing:                     │
│  ✓ They possess a card matching the condition              │
│  ✓ The card belongs to their committed hand                │
│  ✓ Without revealing the actual card                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Challenge Phase                          │
│                                                             │
│  Players can challenge opponent's proof:                    │
│  • "Liar!" - Claim opponent doesn't have the card          │
│  • "Truth" - Accept opponent's proof                       │
│                                                             │
│  ZK Verifier validates all proofs on-chain                 │
│  Invalid proofs = Instant loss                             │
│  Valid proofs = Continue to next round                     │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Resolution

```
┌─────────────────────────────────────────────────────────────┐
│                    Result Phase                             │
│                                                             │
│  Smart Contract determines winner based on:                 │
│  • Validity of ZK proofs                                    │
│  • Challenge outcomes                                       │
│  • Game rules (lives remaining)                             │
│                                                             │
│  Winner gets +1 score, loser loses 1 life                  │
│  Game ends when a player reaches 0 lives                   │
└─────────────────────────────────────────────────────────────┘
```

## 🔬 Zero-Knowledge Circuit

### Circuit Logic (Noir)

The heart of the privacy mechanism is the Noir circuit that proves card possession without revealing the card:

```noir
// Simplified representation of the hand verification circuit
fn verify_hand_condition(
    // Private inputs (never revealed on-chain)
    hand: [Card; 5],              // Player's 5 cards
    card_index: u8,               // Which card satisfies condition

    // Public inputs (verified on-chain)
    hand_commitment: Field,       // Hash of entire hand
    condition_suit: u8,           // Required suit
    condition_value: u8,          // Minimum value
    game_id: Field,               // Game identifier
) -> bool {
    // 1. Verify the hand commitment matches
    let computed_commitment = poseidon_hash(hand);
    assert(computed_commitment == hand_commitment);

    // 2. Verify the selected card meets the condition
    let selected_card = hand[card_index];
    assert(selected_card.suit == condition_suit);
    assert(selected_card.value >= condition_value);

    // 3. Verify card is valid (not duplicate, in valid range)
    assert(is_valid_card(selected_card));
    assert(no_duplicates_in_hand(hand));

    true
}
```

### Proof Generation Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    Client-Side (Browser)                        │
│                                                                 │
│  Step 1: Player Input                                          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Hand: [♠A, ♥K, ♦Q, ♣J, ♠10]                            │  │
│  │ Condition: Suit=HEARTS, Value>=10                        │  │
│  │ Selected Card: ♥K (index=1, satisfies condition)        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  Step 2: Noir Circuit Execution (WASM)                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ • Load circuit.json (compiled Noir circuit)              │  │
│  │ • Prepare witness data from inputs                       │  │
│  │ • Execute circuit constraints                            │  │
│  │ • Generate witness file                                  │  │
│  │ ⏱️  ~500ms                                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  Step 3: Barretenberg Proof Generation                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ • Initialize UltraHonk prover                            │  │
│  │ • Generate proof with Starknet ZK mode                   │  │
│  │ • Proof size: ~200KB                                     │  │
│  │ ⏱️  ~2-3 seconds (first run ~5s due to WASM init)       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  Step 4: Garaga Calldata Formatting                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ • Serialize proof for Cairo contract                     │  │
│  │ • Format public inputs                                   │  │
│  │ • Generate optimized calldata                            │  │
│  │ ⏱️  ~100ms                                                │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│                    ZStarknet Blockchain                         │
│                                                                 │
│  Step 5: On-Chain Verification                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Garaga Verifier Contract (Cairo)                         │  │
│  │ • Verify UltraHonk proof                                 │  │
│  │ • Check public inputs match game state                   │  │
│  │ • Validate commitment hasn't been used before            │  │
│  │ ⏱️  ~500K gas, ~2-3 seconds                              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  Step 6: Game State Update                                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Dojo Game Contract (Cairo)                               │  │
│  │ • Update game state with verified proof                  │  │
│  │ • Progress to next phase                                 │  │
│  │ • Emit events for frontend                               │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Privacy Guarantees

**What remains private:**
- ✅ Individual cards in your hand
- ✅ Position of cards that satisfy conditions
- ✅ Cards you don't use in proofs

**What is public:**
- ✅ Hand commitment (hash)
- ✅ That you possess a card matching the condition
- ✅ The condition itself
- ✅ Game outcomes and scores

**Security properties:**
- ✅ **Soundness**: Cannot prove false statements (forged proofs rejected)
- ✅ **Zero-Knowledge**: No information leaked beyond the claim
- ✅ **Non-malleable**: Proofs cannot be modified or replayed
- ✅ **Commitment Binding**: Cannot change hand after commitment

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Scarb 2.8.4+ (Cairo package manager)
- Starknet Foundry (sncast)
- Python 3.10 (for Garaga)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/liars-proof.git
cd liars-proof
```

2. **Install dependencies**
```bash
# Client
cd client
pnpm install

# Contracts
cd ../contracts
scarb build
```

3. **Set up environment**
```bash
cp client/.env.sample client/.env
# Edit .env with your configuration
```

### Running Locally

#### Option 1: Local Development (Katana)

```bash
# Terminal 1: Start local Katana node
make katana

# Terminal 2: Deploy contracts and start Torii
cd contracts && ./scripts/setup.sh dev

# Terminal 3: Start client
cd client && pnpm dev
```

Visit `http://localhost:1337`

#### Option 2: ZStarknet Testnet

Already deployed! Visit the live demo:
- **Game**: https://liars-proof.vercel.app
- **Explorer**: https://explorer-zstarknet.d.karnot.xyz

### Playing as Guest

We've implemented a **Guest Wallet** feature for seamless onboarding:

1. Click **"👤 PLAY AS GUEST"** on the login page
2. A wallet is automatically generated and funded
3. Start playing immediately - no wallet extension required!

**How it works:**
- Generates OpenZeppelin account with random keypair
- Auto-funded from owner wallet (0.0001 ETH)
- Auto-deployed on first transaction
- Persists in localStorage for returning players

## 🎲 How to Play

### Step 1: Connect Wallet
- Use Ready/Braavos wallet, or
- Click "Play as Guest" for instant access

### Step 2: Create or Join Game
- **Create**: Start a new game and wait for opponent
- **Join**: Enter game ID to join existing game

### Step 3: Select Your Hand
- Choose 5 cards from the deck
- Cards are committed privately using ZK proof
- Opponent cannot see your selection

### Step 4: Prove Your Claims
- Each round presents a condition (e.g., "♥ card with value ≥ 10")
- Generate ZK proof that you have a matching card
- Submit proof to smart contract

### Step 5: Challenge or Accept
- Challenge opponent if you think they're bluffing
- Accept to progress to next round
- Invalid proofs result in instant loss!

### Step 6: Win the Game
- First player to reduce opponent to 0 lives wins
- Each won round: +1 score for winner, -1 life for loser
- Strategy: Know when to bluff and when to challenge!

## 🛠️ Development

### Project Structure

```
liars-proof/
├── client/                      # React frontend
│   ├── src/
│   │   ├── utils/
│   │   │   ├── proofGenerator.ts    # Noir proof generation
│   │   │   ├── proofHelpers.ts      # Proof formatting
│   │   │   └── guestWallet.ts       # Guest wallet logic
│   │   ├── hooks/
│   │   │   ├── useProofGeneration.ts
│   │   │   ├── useGameModels.ts
│   │   │   └── useGuestWallet.ts
│   │   ├── assets/
│   │   │   ├── circuit.json         # Compiled Noir circuit
│   │   │   └── vk.bin               # Verification key
│   │   └── pages/
│   │       ├── Login.tsx
│   │       ├── Game.tsx
│   │       └── Proof.tsx            # Proof testing UI
│   └── package.json
│
├── contracts/                   # Cairo smart contracts
│   ├── src/
│   │   ├── systems/
│   │   │   └── game_system.cairo    # Main game logic
│   │   ├── models/
│   │   │   ├── game.cairo           # Game state model
│   │   │   ├── hand.cairo           # Hand commitment model
│   │   │   └── proof.cairo          # Proof verification model
│   │   └── traits/
│   └── Scarb.toml
│
├── circuit/                     # Noir ZK circuit
│   ├── src/
│   │   └── main.nr              # Hand verification circuit
│   ├── Prover.toml              # Circuit inputs
│   └── Nargo.toml
│
├── verifier/                    # Generated Cairo verifier
│   └── src/
│       └── lib.cairo            # Garaga-generated verifier
│
└── README.md
```

### Testing Proof Generation

Visit the proof testing page:
```bash
cd client && pnpm dev
# Navigate to http://localhost:1337/proof
```

Features:
- Test proof generation with custom inputs
- See proof generation time and status
- Verify calldata formatting
- Debug circuit execution

### Running Tests

```bash
# Client tests
cd client
pnpm test              # Run once
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report

# Contract tests
cd contracts
sozo test
```

### Building for Production

```bash
# Client
cd client
pnpm build

# Contracts
cd contracts
sozo build
```

## 📊 Performance Metrics

| Operation | Time | Gas Cost |
|-----------|------|----------|
| Proof Generation (Client) | ~2-3s | N/A |
| Proof Verification (On-chain) | ~2-3s | ~500K gas |
| Hand Commitment | ~1s | ~200K gas |
| Game State Update | <1s | ~100K gas |

## 🔐 Security Considerations

### Production Warnings

⚠️ **Guest Wallet Security**:
- Guest wallets store private keys in localStorage
- **NOT SECURE** for production with real funds
- Intended for:
  - Demo/testnet environments
  - User onboarding
  - Quick testing

For production mainnet, users **MUST** use proper wallet extensions.

### Smart Contract Security

- All proofs verified on-chain before state updates
- Commitment binding prevents hand changes
- Replay protection via game_id and round number
- No trusted third parties required

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🌟 Acknowledgments

- **Zypherpunk Hackathon** - For hosting this amazing privacy-focused event
- **Noir Language** - For making ZK circuits accessible
- **Garaga Team** - For the incredible Cairo verifier toolchain
- **Dojo Engine** - For the powerful on-chain game framework
- **ZStarknet** - For providing the testnet infrastructure

## 📞 Support & Links

- **Live Demo**: https://liars-proof.vercel.app
- **ZStarknet Explorer**: https://explorer-zstarknet.d.karnot.xyz
- **Zypherpunk Hackathon**: https://zypherpunk.xyz/
- **Telegram**: [@zypherpunk](https://t.me/+euCua6eocTc1NmM1)

---

**Built with privacy, powered by Zero-Knowledge. 🔐**
