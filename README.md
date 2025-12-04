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
│                                              +                   │
│                                    ┌──────────────────┐         │
│                                    │  Garaga Calldata │         │
│                                    │    Formatter     │         │
│                                    └──────────────────┘         │
└────────────────────────────────────────────┬────────────────────┘
                                             │
                                             +
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

## 🎮 Game Flow Diagram

Complete sequence diagram showing the entire game flow from creation to end, including ZK proof generation and verification:

```mermaid
sequenceDiagram
    participant P1 as Player 1
    participant P2 as Player 2
    participant FE as Frontend
    participant Noir as Noir Circuit
    participant BB as Barretenberg
    participant BC as ZStarknet
    participant Garaga as Garaga Verifier

    %% Create game
    P1->>FE: Create new game
    FE->>BC: create_game(player_name)
    BC-->>FE: game_id, WaitingForPlayers

    %% Join game
    P2->>FE: Join game with game_id
    FE->>BC: join_game(game_id, player_name)
    BC-->>FE: WaitingForHandCommitments

    %% Player 1 hand commitment
    P1->>FE: Select 5 cards
    Note over FE: Cards: [♠A, ♥K, ♦Q, ♣J, ♠10]
    FE->>FE: Compute commitment = hash(cards)
    FE->>Noir: Execute circuit with hand
    Noir-->>FE: witness
    FE->>BB: Generate UltraHonk proof
    Note over BB: ~2-3 seconds
    BB-->>FE: proof + public_inputs
    FE->>BC: submit_hand_commitment(game_id, commitment, proof)
    BC->>Garaga: verify_proof(proof, commitment)
    Garaga-->>BC: ✓ Valid
    BC-->>FE: Hand commitment stored

    %% Player 2 hand commitment
    P2->>FE: Select 5 cards
    Note over FE: Cards: [♦A, ♣K, ♥J, ♠9, ♦8]
    FE->>FE: Compute commitment = hash(cards)
    FE->>Noir: Execute circuit with hand
    Noir-->>FE: witness
    FE->>BB: Generate UltraHonk proof
    BB-->>FE: proof + public_inputs
    FE->>BC: submit_hand_commitment(game_id, commitment, proof)
    BC->>Garaga: verify_proof(proof, commitment)
    Garaga-->>BC: ✓ Valid
    BC->>BC: Generate random condition
    BC-->>FE: ConditionPhase
    Note over BC: Condition: "♥ card ≥ 10"

    %% Player 1 proves condition
    P1->>FE: Select card matching condition (♥K)
    FE->>Noir: Execute circuit(hand, card, condition)
    Note over Noir: Verify:<br/>1. commitment matches<br/>2. card in hand<br/>3. card satisfies condition
    Noir-->>FE: witness
    FE->>BB: Generate proof
    BB-->>FE: proof
    FE->>BC: submit_condition_proof(game_id, proof)
    BC->>Garaga: verify_proof(proof, condition)
    Garaga-->>BC: ✓ Valid
    BC-->>FE: Proof submitted

    %% Player 2 proves condition
    P2->>FE: Select card matching condition (♥J)
    FE->>Noir: Execute circuit(hand, card, condition)
    Noir-->>FE: witness
    FE->>BB: Generate proof
    BB-->>FE: proof
    FE->>BC: submit_condition_proof(game_id, proof)
    BC->>Garaga: verify_proof(proof, condition)
    Garaga-->>BC: ✓ Valid
    BC-->>FE: ChallengePhase

    %% Challenge phase
    alt Player 1 challenges Player 2
        P1->>FE: Click "Liar!"
        FE->>BC: submit_challenge(game_id, P2)
        BC->>Garaga: Re-verify P2's proof
        alt P2's proof is valid
            Garaga-->>BC: ✓ Valid
            BC-->>FE: P2 wins, P1 loses 1 life
        else P2's proof is invalid
            Garaga-->>BC: ✗ Invalid
            BC-->>FE: P1 wins, P2 loses 1 life
        end
    else Both accept
        P1->>FE: Click "Truth"
        P2->>FE: Click "Truth"
        FE->>BC: both_accept(game_id)
        BC-->>FE: Round draw
    end

    %% Next round or game over
    BC->>BC: Check lives remaining
    alt Game continues (lives > 0)
        BC-->>FE: New ConditionPhase
        Note over BC: Generate new condition
    else Game over (lives = 0)
        BC-->>FE: GameOver, winner announced
    end
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
│                          +                                      │
│  Step 2: Noir Circuit Execution (WASM)                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ • Load circuit.json (compiled Noir circuit)              │  │
│  │ • Prepare witness data from inputs                       │  │
│  │ • Execute circuit constraints                            │  │
│  │ • Generate witness file                                  │  │
│  │ ⏱️  ~500ms                                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          +                                      │
│  Step 3: Barretenberg Proof Generation                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ • Initialize UltraHonk prover                            │  │
│  │ • Generate proof with Starknet ZK mode                   │  │
│  │ • Proof size: ~200KB                                     │  │
│  │ ⏱️  ~2-3 seconds (first run ~5s due to WASM init)       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          +                                      │
│  Step 4: Garaga Calldata Formatting                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ • Serialize proof for Cairo contract                     │  │
│  │ • Format public inputs                                   │  │
│  │ • Generate optimized calldata                            │  │
│  │ ⏱️  ~100ms                                                │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                          │
                          +
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
│                          +                                      │
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

Already deployed! Visit the live demo:
- **Game**: https://liars-proof.vercel.app
- **Explorer**: https://explorer-zstarknet.d.karnot.xyz

### Playing as Guest

We've implemented a **Guest Wallet** feature for seamless onboarding:

1. Click **"PLAY AS GUEST"** on the login page
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

---

**Built with privacy, powered by Caravana Studio. 🔐**
