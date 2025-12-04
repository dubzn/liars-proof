# Liar's Proof - Simplified Game Flow

This document shows the complete game flow from a single player's perspective, including:
- **Commitment Phase**: Random hand generation + Poseidon hash
- **Condition Phase**: Player declares YES/NO (do I fulfill the condition?)
- **Challenge Phase**: Player chooses to BELIEVE or DON'T BELIEVE opponent
- **Result Phase**: ZK proof generation and on-chain verification

The key logic: **A player lies when their claim doesn't match the proof result** → `lied = (condition_choice ≠ proof_valid)`

## Game Flow (Single Player View)

```mermaid
sequenceDiagram
    participant P as Player
    participant FE as Frontend
    participant Poseidon as Poseidon Hash (Garaga)
    participant Noir as Noir Circuit
    participant BB as Barretenberg
    participant BC as Contract (ZStarknet)

    Note over P,BC: PHASE 1: Hand Commitment

    P->>FE: Game starts
    FE->>FE: Generate random 5-card hand
    Note over FE: Example: [♥4, ♦3, ♣J]

    FE->>Poseidon: hash(cards)
    Poseidon-->>FE: hand_commitment (u256)

    FE->>BC: submit_hand_commitment(game_id, hand_commitment)
    BC-->>FE: ✓ Commitment stored
    Note over BC: Waiting for opponent...

    Note over P,BC: PHASE 2: Condition Choice

    BC->>BC: Generate random condition
    BC-->>FE: Condition revealed
    Note over FE: Example: "♥ card with value ≥ 10"

    FE-->>P: "Do you fulfill the condition?"
    P->>FE: Choose YES or NO (boolean)

    FE->>BC: submit_condition_choice(game_id, boolean)
    BC-->>FE: ✓ Choice stored
    Note over BC: Waiting for opponent...

    Note over P,BC: PHASE 3: Challenge Phase

    BC-->>FE: Opponent's choice revealed
    Note over FE: Opponent says: YES/NO

    FE-->>P: "Do you believe the opponent?"
    P->>FE: Choose BELIEVE or DON'T BELIEVE (boolean)

    FE->>BC: submit_challenge_choice(game_id, boolean)
    BC-->>FE: ✓ Challenge stored
    Note over BC: Waiting for opponent...

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

    Note over P,BC: Next Round or Game Over

    alt Lives > 0 and Score < 50
        BC-->>FE: GameState::ConditionPhase
        Note over P,BC: Loop back to Phase 2
    else Lives = 0 or Score ≥ 50
        BC-->>FE: GameState::GameOver
        FE-->>P: Game Over! Winner declared
    end
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
