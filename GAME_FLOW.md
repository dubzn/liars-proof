# Liar's Proof - Simplified Game Flow

This document shows the complete game flow from a single player's perspective, including:
- **Commitment Phase**: Random hand generation + Poseidon hash
- **Condition Phase**: Player declares YES/NO (do I fulfill the condition?)
- **Challenge Phase**: Player chooses to BELIEVE or DON'T BELIEVE opponent
- **Result Phase**: ZK proof generation and on-chain verification

The key logic: **A player lies when their claim doesn't match the proof result** → `lied = (condition_choice ≠ proof_valid)`

## Simplified Game Flow (Single Player View)

```mermaid
sequenceDiagram
    participant P as Player
    participant FE as Frontend
    participant Poseidon as Poseidon Hash (Garaga)
    participant Noir as Noir Circuit
    participant BB as Barretenberg
    participant BC as Contract (ZStarknet)

    %% ==================== COMMITMENT PHASE ====================
    rect rgb(255, 230, 200)
    Note over P,BC: PHASE 1: Hand Commitment

    P->>FE: Game starts
    FE->>FE: Generate random 5-card hand
    Note over FE: Example: [♠A, ♥K, ♦Q, ♣J, ♠10]

    FE->>Poseidon: hash(cards)
    Poseidon-->>FE: hand_commitment (u256)

    FE->>BC: submit_hand_commitment(game_id, hand_commitment)
    BC-->>FE: ✓ Commitment stored
    Note over BC: Waiting for opponent...
    end

    %% ==================== CONDITION PHASE ====================
    rect rgb(200, 255, 220)
    Note over P,BC: PHASE 2: Condition Choice

    BC->>BC: Generate random condition
    BC-->>FE: Condition revealed
    Note over FE: Example: "♥ card with value ≥ 10"

    FE-->>P: "Do you fulfill the condition?"
    P->>FE: Choose YES or NO (boolean)

    FE->>BC: submit_condition_choice(game_id, boolean)
    BC-->>FE: ✓ Choice stored
    Note over BC: Waiting for opponent...
    end

    %% ==================== CHALLENGE PHASE ====================
    rect rgb(255, 220, 220)
    Note over P,BC: PHASE 3: Challenge Phase

    BC-->>FE: Opponent's choice revealed
    Note over FE: Opponent says: YES/NO

    FE-->>P: "Do you believe the opponent?"
    P->>FE: Choose BELIEVE or DON'T BELIEVE (boolean)

    FE->>BC: submit_challenge_choice(game_id, boolean)
    BC-->>FE: ✓ Challenge stored
    Note over BC: Waiting for opponent...
    end

    %% ==================== RESULT PHASE ====================
    rect rgb(220, 220, 255)
    Note over P,BC: PHASE 4: Proof Generation & Submission

    FE->>Noir: Generate ZK proof for hand
    Note over Noir: Proves:<br/>1. Hand matches commitment<br/>2. Card satisfies/doesn't satisfy condition
    Noir-->>FE: witness.gz

    FE->>BB: Generate UltraHonk proof
    Note over BB: ~2-3 seconds
    BB-->>FE: proof + calldata

    FE->>BC: submit_round_proof(game_id, proof)
    BC->>BC: Verify proof on-chain
    BC-->>FE: ✓ Proof valid/invalid

    BC->>BC: resolve_round()<br/>Compare choices with proof results
    Note over BC: Determine who lied:<br/>lied = (condition_choice ≠ proof_valid)

    BC-->>FE: Round results (score, lives)
    FE-->>P: Show round outcome
    end

    %% ==================== NEXT ROUND ====================
    rect rgb(240, 240, 240)
    Note over P,BC: Next Round or Game Over

    alt Lives > 0 and Score < 50
        BC-->>FE: GameState::ConditionPhase
        Note over P,BC: Loop back to Phase 2
    else Lives = 0 or Score ≥ 50
        BC-->>FE: GameState::GameOver
        FE-->>P: Game Over! Winner declared
    end
    end
```

## Game Phases Summary

| Phase | Frontend Action | Contract Action | Output |
|-------|----------------|-----------------|--------|
| **1. Commitment** | Generate random hand → Poseidon hash | Store `hand_commitment` | Waiting for opponent |
| **2. Condition** | Player chooses YES/NO | Store `condition_choice` boolean | Reveal condition |
| **3. Challenge** | Player chooses BELIEVE/DON'T BELIEVE | Store `challenge_choice` boolean | Opponent's claim visible |
| **4. Result** | Generate ZK proof → Submit | Verify proof → Calculate `lied = (choice ≠ proof_valid)` → Resolve round | Score/lives updated |

## State Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> WaitingForPlayers: create_game()

    WaitingForPlayers --> WaitingForHandCommitments: join_game()

    WaitingForHandCommitments --> ConditionPhase: Both players submit commitments

    ConditionPhase --> ChallengePhase: Both players submit condition choices

    ChallengePhase --> ResultPhase: Both players submit challenge choices

    ResultPhase --> ConditionPhase: Lives > 0 & Score < 50<br/>(new round)
    ResultPhase --> GameOver: Lives = 0 OR Score ≥ 50

    GameOver --> [*]

    note right of WaitingForHandCommitments
        Frontend generates random hand
        Poseidon hash → commitment
        Submit to contract
    end note

    note right of ConditionPhase
        Random condition revealed
        Player chooses: YES/NO
        (Do I fulfill the condition?)
    end note

    note right of ChallengePhase
        See opponent's choice
        Player chooses: BELIEVE/DON'T BELIEVE
        (Is opponent telling the truth?)
    end note

    note right of ResultPhase
        Generate ZK proof
        Submit to contract
        Contract verifies & resolves round
        lied = (choice ≠ proof_valid)
    end note
```

## Privacy Zones

```mermaid
graph TB
    subgraph "🔒 PRIVATE (Never Revealed)"
        A1[Individual Cards in Hand]
        A2[Card Positions/Indices]
        A3[Cards Not Used in Proofs]
        A4[Private Key of Commitment]
    end

    subgraph "🔐 COMMITTED (Binding but Hidden)"
        B1[Hand Commitment Hash]
        B2[Total Hand Composition]
    end

    subgraph "👁️ PUBLIC (Visible to All)"
        C1[Game ID & Player Addresses]
        C2[Game State]
        C3[Condition Requirements]
        C4[That a Card Exists matching Condition]
        C5[Challenge Results]
        C6[Scores & Lives]
        C7[Winner Address]
    end

    subgraph "✅ VERIFIED (ZK Proof)"
        D1[Player Has Matching Card]
        D2[Card Belongs to Committed Hand]
        D3[Card Satisfies Condition]
        D4[No Cheating Proof Validity]
    end

    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1

    B1 --> D1
    B2 --> D2

    C3 --> D3

    D1 --> C4
    D2 --> C4
    D3 --> C4
    D4 --> C5

    style A1 fill:#ffcccc
    style A2 fill:#ffcccc
    style A3 fill:#ffcccc
    style A4 fill:#ffcccc

    style B1 fill:#ffffcc
    style B2 fill:#ffffcc

    style C1 fill:#ccffcc
    style C2 fill:#ccffcc
    style C3 fill:#ccffcc
    style C4 fill:#ccffcc
    style C5 fill:#ccffcc
    style C6 fill:#ccffcc
    style C7 fill:#ccffcc

    style D1 fill:#ccccff
    style D2 fill:#ccccff
    style D3 fill:#ccccff
    style D4 fill:#ccccff
```

## ZK Proof Generation Pipeline

```mermaid
flowchart TB
    subgraph Frontend["Frontend (Browser)"]
        A[Random Hand Generation] --> B[Poseidon Hash]
        B --> C[hand_commitment u256]
        C --> D[Noir Circuit Execution]
        D --> E[Barretenberg Prover]
        E --> F[Proof + Calldata]
    end

    subgraph Contract["Smart Contract (ZStarknet)"]
        G[Receive Proof] --> H{Garaga Verifier}
        H -->|Valid| I[Store is_valid = true]
        H -->|Invalid| J[Store is_valid = false]
        I --> K[resolve_round]
        J --> K
        K --> L[Calculate: lied = choice ≠ proof_valid]
    end

    F -->|Submit to Contract| G

    style B fill:#FFE082
    style D fill:#CE93D8
    style E fill:#BA68C8
    style H fill:#AB47BC
    style L fill:#66BB6A
```

## Guest Wallet Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant LocalStorage
    participant OwnerWallet
    participant ZStarknet

    User->>Frontend: Click "PLAY AS GUEST"

    alt Guest Wallet Exists
        Frontend->>LocalStorage: Check for saved wallet
        LocalStorage-->>Frontend: Found wallet data
        Frontend-->>User: "Restored guest wallet"
    else New Guest Wallet
        Frontend->>Frontend: Generate random keypair
        Frontend->>Frontend: Compute OZ account address
        Frontend->>LocalStorage: Save wallet data

        Frontend->>OwnerWallet: Transfer 0.0001 ETH
        OwnerWallet->>ZStarknet: execute(transfer)
        ZStarknet-->>Frontend: Funding confirmed

        Note over Frontend: Wait 2 seconds

        Frontend->>ZStarknet: deployAccount()
        ZStarknet-->>Frontend: Deployment confirmed

        Note over Frontend: Wait 2 seconds

        Frontend->>LocalStorage: Mark as deployed
        Frontend-->>User: "Guest wallet ready!"
    end

    User->>Frontend: Create/Join game
    Frontend->>ZStarknet: Game transaction
    ZStarknet-->>User: Transaction confirmed
```

## Key Game Mechanics

### 🎮 Core Flow
1. **Commitment**: Frontend generates random hand → Poseidon hash → Submit to contract
2. **Condition**: Player declares YES (I fulfill) or NO (I don't fulfill)
3. **Challenge**: Player chooses to BELIEVE or DON'T BELIEVE opponent's claim
4. **Result**: Generate ZK proof → Verify on-chain → Resolve round

### 🎯 Lying Detection Logic
```
player_lies = (condition_choice ≠ proof_valid)
```

| Declared | Proof Valid | Result |
|----------|-------------|--------|
| YES (fulfill) | ✅ Valid | Telling truth |
| YES (fulfill) | ❌ Invalid | **LYING** |
| NO (don't fulfill) | ✅ Valid | **LYING** |
| NO (don't fulfill) | ❌ Invalid | Telling truth |

### 🏆 Scoring System
- **Caught lying**: Opponent gets +20 points, you lose 1 life
- **Successful lie**: You get +10 points
- **Wrong challenge**: You lose 1 life
- **Game ends**: Lives = 0 OR Score ≥ 50

### 🔐 Privacy
- **Zero-Knowledge**: Cards never revealed, only proven
- **Binding**: Cannot change hand after commitment (Poseidon hash)
- **On-chain verification**: Garaga verifier in Cairo contract

---

**Built with ZK privacy on ZStarknet 🔐**
