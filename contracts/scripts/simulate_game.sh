#!/bin/bash

set -e

profile="${1:-dev}"

sozo build -P alice
sozo build -P bob

echo "==================================="
echo "🎮 Liars Proof - Game Simulation"
echo "==================================="
echo ""

# Step 1: Bob creates the game
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Step 1: Bob creates a new game"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sozo -P bob execute \
    liars_proof-game_system create \
    str:Bob

GAME_ID=3
echo "✅ Game created! Game ID: $GAME_ID"
echo ""

sleep 8

# Step 2: Alice joins the game
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤝 Step 2: Alice joins the game"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sozo -P alice execute \
    liars_proof-game_system join \
    $GAME_ID str:Alice

echo "✅ Alice joined the game!"
echo ""

sleep 8

# Step 3: Bob submits hand commitment
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎴 Step 3: Bob submits hand commitment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BOB_HAND_COMMITMENT="0x1"
sozo -P bob execute \
    liars_proof-game_system submit_hand_commitment \
    $GAME_ID $BOB_HAND_COMMITMENT

echo "✅ Bob's hand commitment submitted!"
echo "   Commitment: $BOB_HAND_COMMITMENT"
echo ""

sleep 8

# Step 4: Alice submits hand commitment
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎴 Step 4: Alice submits hand commitment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ALICE_HAND_COMMITMENT="0x1"
sozo -P alice execute \
    liars_proof-game_system submit_hand_commitment \
    $GAME_ID $ALICE_HAND_COMMITMENT

echo "✅ Alice's hand commitment submitted!"
echo "   Commitment: $ALICE_HAND_COMMITMENT"
echo ""
echo "🎯 Game state: ConditionPhase (Round 1)"
echo ""

sleep 8

# Step 5: Bob submits condition choice
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎲 Step 5: Bob submits condition choice"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BOB_CONDITION_CHOICE=1  # Bob claims he meets the condition
sozo -P bob execute \
    liars_proof-game_system submit_condition_choice \
    $GAME_ID $BOB_CONDITION_CHOICE

echo "✅ Bob's condition choice submitted!"
echo "   Choice: $BOB_CONDITION_CHOICE (claims to meet condition)"
echo ""

sleep 8

# Step 6: Alice submits condition choice
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎲 Step 6: Alice submits condition choice"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ALICE_CONDITION_CHOICE=0  # Alice claims she doesn't meet the condition
sozo -P alice execute \
    liars_proof-game_system submit_condition_choice \
    $GAME_ID $ALICE_CONDITION_CHOICE

echo "✅ Alice's condition choice submitted!"
echo "   Choice: $ALICE_CONDITION_CHOICE (claims not to meet condition)"
echo ""
echo "🎯 Game state: ChallengePhase"
echo ""

sleep 8

# Step 7: Bob submits challenge choice
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚔️  Step 7: Bob submits challenge choice"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BOB_CHALLENGE_CHOICE=0  # Bob thinks Alice is lying
sozo -P bob execute \
    liars_proof-game_system submit_challenge_choice \
    $GAME_ID $BOB_CHALLENGE_CHOICE

echo "✅ Bob's challenge choice submitted!"
echo "   Choice: $BOB_CHALLENGE_CHOICE (Bob thinks Alice is lying)"
echo ""

sleep 8

# Step 8: Alice submits challenge choice
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚔️  Step 8: Alice submits challenge choice"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ALICE_CHALLENGE_CHOICE=1  # Alice believes Bob is telling the truth
sozo -P alice execute \
    liars_proof-game_system submit_challenge_choice \
    $GAME_ID $ALICE_CHALLENGE_CHOICE

echo "✅ Alice's challenge choice submitted!"
echo "   Choice: $ALICE_CHALLENGE_CHOICE (Alice believes Bob is telling the truth)"
echo ""
echo "🎯 Game state: ResultPhase"
echo ""

echo "==================================="
echo "✨ Game simulation completed!"
echo "==================================="
echo ""
echo "Next steps:"
echo "  - Players need to submit their proofs using submit_round_proof"
echo "  - The game will resolve and award points/lives accordingly"
echo ""
echo "Game Summary:"
echo "  Game ID: $GAME_ID"
echo "  Bob's claim: Meets condition"
echo "  Alice's claim: Doesn't meet condition"
echo "  Bob thinks: Alice is lying"
echo "  Alice thinks: Bob is telling the truth"
echo ""
