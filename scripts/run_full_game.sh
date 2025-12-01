#!/bin/bash

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

CONFIG_FILE="${1:-game_config.toml}"
PROFILE="${2:-dev}"

# If CONFIG_FILE is not an absolute path, look for it in project root
if [[ "$CONFIG_FILE" != /* ]]; then
    CONFIG_FILE="$PROJECT_ROOT/$CONFIG_FILE"
fi

cd "$PROJECT_ROOT"

echo "╔═══════════════════════════════════╗"
echo "║  🎮 Liars Proof - Full Game Flow ║"
echo "╔═══════════════════════════════════╗"
echo ""

# Step 1: Read game configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 1: Reading game configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to read TOML values
read_toml() {
    local key=$1
    grep "^$key" "$CONFIG_FILE" | cut -d'"' -f2
}

GAME_ID=$(read_toml "game_id")

# Read player 1 config
P1_CARD1_SUIT=$(read_toml "card1_suit" | head -1)
P1_CARD1_VALUE=$(read_toml "card1_value" | head -1)
P1_CARD2_SUIT=$(read_toml "card2_suit" | head -1)
P1_CARD2_VALUE=$(read_toml "card2_value" | head -1)
P1_CARD3_SUIT=$(read_toml "card3_suit" | head -1)
P1_CARD3_VALUE=$(read_toml "card3_value" | head -1)
P1_CONDITION_CHOICE=$(read_toml "condition_choice" | head -1)
P1_CHALLENGE_CHOICE=$(read_toml "challenge_choice" | head -1)

# Read player 2 config
P2_CARD1_SUIT=$(read_toml "card1_suit" | tail -1)
P2_CARD1_VALUE=$(read_toml "card1_value" | tail -1)
P2_CARD2_SUIT=$(read_toml "card2_suit" | tail -1)
P2_CARD2_VALUE=$(read_toml "card2_value" | tail -1)
P2_CARD3_SUIT=$(read_toml "card3_suit" | tail -1)
P2_CARD3_VALUE=$(read_toml "card3_value" | tail -1)
P2_CONDITION_CHOICE=$(read_toml "condition_choice" | tail -1)
P2_CHALLENGE_CHOICE=$(read_toml "challenge_choice" | tail -1)

# Calculate hand commitments
cd hash

cat > Prover.toml <<HASH_PROVER
[hand]
card1_suit = "$P1_CARD1_SUIT"
card1_value = "$P1_CARD1_VALUE"
card2_suit = "$P1_CARD2_SUIT"
card2_value = "$P1_CARD2_VALUE"
card3_suit = "$P1_CARD3_SUIT"
card3_value = "$P1_CARD3_VALUE"
HASH_PROVER

nargo check > /dev/null 2>&1
BOB_HAND_COMMITMENT=$(nargo execute witness 2>&1 | grep "0x" | tail -1)

cat > Prover.toml <<HASH_PROVER
[hand]
card1_suit = "$P2_CARD1_SUIT"
card1_value = "$P2_CARD1_VALUE"
card2_suit = "$P2_CARD2_SUIT"
card2_value = "$P2_CARD2_VALUE"
card3_suit = "$P2_CARD3_SUIT"
card3_value = "$P2_CARD3_VALUE"
HASH_PROVER

nargo execute witness > /dev/null 2>&1
ALICE_HAND_COMMITMENT=$(nargo execute witness 2>&1 | grep "0x" | tail -1)

cd "$PROJECT_ROOT"

echo "Game Configuration:"
echo "  Game ID: $GAME_ID"
echo "  Bob's hand commitment: $BOB_HAND_COMMITMENT"
echo "  Alice's hand commitment: $ALICE_HAND_COMMITMENT"
echo ""

sleep 2

# Step 2: Run game simulation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎮 Step 2: Running game simulation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd contracts

sozo -P bob build
sozo -P alice build

# Step 2.1: Bob creates the game
echo "📝 Step 2.1: Bob creates a new game"
sozo -P bob execute \
    game_system create \
    str:Bob

# Note: In production, you'd capture the actual GAME_ID from the transaction
echo "✅ Game created! Game ID: $GAME_ID"
echo ""

sleep 15

# Step 2.2: Alice joins the game
echo "🤝 Step 2.2: Alice joins the game"
sozo -P alice execute \
    game_system join \
    $GAME_ID str:Alice

echo "✅ Alice joined the game!"
echo ""

sleep 25

# Step 2.3: Bob submits hand commitment
echo "🎴 Step 2.3: Bob submits hand commitment"
sozo -P bob execute \
    game_system submit_hand_commitment \
    $GAME_ID u256:$BOB_HAND_COMMITMENT

echo "✅ Bob's hand commitment submitted!"
echo ""

sleep 25

# Step 2.4: Alice submits hand commitment
echo "🎴 Step 2.4: Alice submits hand commitment"
sozo -P alice execute \
    game_system submit_hand_commitment \
    $GAME_ID u256:$ALICE_HAND_COMMITMENT

echo "✅ Alice's hand commitment submitted!"
echo "🎯 Game state: ConditionPhase (Round 1)"
echo ""

sleep 25

# Step 2.5: Get the generated condition
echo "🔍 Step 2.5: Retrieving generated condition"
echo "Using profile: alice, Game ID: $GAME_ID"

# First, get the Game to obtain the condition_id
GAME_OUTPUT=$(sozo -P alice model get Game $GAME_ID)

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to retrieve game $GAME_ID"
    echo "Output: $GAME_OUTPUT"
    exit 1
fi

echo "Game model:"
echo "$GAME_OUTPUT"
echo ""

# Parse the condition_id from the game output
CONDITION_ID=$(echo "$GAME_OUTPUT" | grep "condition_id" | grep -oE '[0-9]+')

if [ -z "$CONDITION_ID" ]; then
    echo "❌ Error: Failed to parse condition_id from game"
    echo "CONDITION_ID: $CONDITION_ID"
    exit 1
fi

echo "Condition ID from game: $CONDITION_ID"
echo ""

# Now get the Condition model using the condition_id
CONDITION_OUTPUT=$(sozo -P alice model get Condition $CONDITION_ID)

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to retrieve condition from game $GAME_ID"
    echo "Output: $CONDITION_OUTPUT"
    echo ""
    echo "Make sure the game exists and both players have submitted their hand commitments."
    exit 1
fi

echo "$CONDITION_OUTPUT"

# Parse the condition values from the output
CONDITION_ID=$(echo "$CONDITION_OUTPUT" | grep "id" | grep -oE '[0-9]+')
CONDITION=$(echo "$CONDITION_OUTPUT" | grep "condition" | grep -oE '[0-9]+')
QUANTITY=$(echo "$CONDITION_OUTPUT" | grep "quantity" | grep -oE '[0-9]+')
COMPARATOR=$(echo "$CONDITION_OUTPUT" | grep "comparator" | grep -oE '[0-9]+')
VALUE=$(echo "$CONDITION_OUTPUT" | grep "value" | grep -oE '[0-9]+' | head -1)
SUIT=$(echo "$CONDITION_OUTPUT" | grep "suit" | grep -oE '[0-9]+' | head -1)

# Verify all values were parsed correctly
if [ -z "$CONDITION_ID" ] || [ -z "$CONDITION" ] || [ -z "$QUANTITY" ] || [ -z "$COMPARATOR" ]; then
    echo "❌ Error: Failed to parse condition values"
    echo "CONDITION_ID: $CONDITION_ID"
    echo "CONDITION: $CONDITION"
    echo "QUANTITY: $QUANTITY"
    echo "COMPARATOR: $COMPARATOR"
    echo "VALUE: $VALUE"
    echo "SUIT: $SUIT"
    exit 1
fi

echo "Generated Condition:"
echo "  ID: $CONDITION_ID"
echo "  Condition: $CONDITION"
echo "  Quantity: $QUANTITY"
echo "  Comparator: $COMPARATOR"
echo "  Value: $VALUE"
echo "  Suit: $SUIT"
echo ""

cd "$PROJECT_ROOT"

sleep 15

# Step 3: Generate proofs with the dynamic condition
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Step 3: Generating ZK Proofs with condition"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Update the config file with the dynamic condition values
cat > game_config.toml <<CONFIG_FILE
game_id = "$GAME_ID"
comparator = "$COMPARATOR"
condition_id = "$CONDITION"
suit = "$SUIT"
value = "$VALUE"

[player_1]
name = "Bob"
card1_suit = "$P1_CARD1_SUIT"
card1_value = "$P1_CARD1_VALUE"
card2_suit = "$P1_CARD2_SUIT"
card2_value = "$P1_CARD2_VALUE"
card3_suit = "$P1_CARD3_SUIT"
card3_value = "$P1_CARD3_VALUE"
condition_choice = "$P1_CONDITION_CHOICE"
challenge_choice = "$P1_CHALLENGE_CHOICE"

[player_2]
name = "Alice"
card1_suit = "$P2_CARD1_SUIT"
card1_value = "$P2_CARD1_VALUE"
card2_suit = "$P2_CARD2_SUIT"
card2_value = "$P2_CARD2_VALUE"
card3_suit = "$P2_CARD3_SUIT"
card3_value = "$P2_CARD3_VALUE"
condition_choice = "$P2_CONDITION_CHOICE"
challenge_choice = "$P2_CHALLENGE_CHOICE"
CONFIG_FILE

if ! ./scripts/generate_proofs.sh "game_config.toml"; then
    echo "❌ Proof generation failed"
    exit 1
fi

echo ""
echo "✅ Proofs generated with dynamic condition!"
echo ""

sleep 30

# Step 4: Submit choices
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎲 Step 4: Submitting player choices"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd contracts

# Step 4.1: Bob submits condition choice
echo "🎲 Step 4.1: Bob submits condition choice"
sozo -P bob execute \
    game_system submit_condition_choice \
    $GAME_ID $P1_CONDITION_CHOICE

echo "✅ Bob's condition choice submitted! (choice: $P1_CONDITION_CHOICE)"
echo ""

sleep 30

# Step 4.2: Alice submits condition choice
echo "🎲 Step 4.2: Alice submits condition choice"
sozo -P alice execute \
    game_system submit_condition_choice \
    $GAME_ID $P2_CONDITION_CHOICE

echo "✅ Alice's condition choice submitted! (choice: $P2_CONDITION_CHOICE)"
echo "🎯 Game state: ChallengePhase"
echo ""

sleep 30

# Step 4.3: Bob submits challenge choice
echo "⚔️  Step 4.3: Bob submits challenge choice"
sozo -P bob execute \
    game_system submit_challenge_choice \
    $GAME_ID $P1_CHALLENGE_CHOICE

echo "✅ Bob's challenge choice submitted! (choice: $P1_CHALLENGE_CHOICE)"
echo ""

sleep 25

# Step 4.4: Alice submits challenge choice
echo "⚔️  Step 4.4: Alice submits challenge choice"
sozo -P alice execute \
    game_system submit_challenge_choice \
    $GAME_ID $P2_CHALLENGE_CHOICE

echo "✅ Alice's challenge choice submitted! (choice: $P2_CHALLENGE_CHOICE)"
echo "🎯 Game state: ResultPhase"
echo ""

sleep 35

cd "$PROJECT_ROOT"

# Step 5: Submit proofs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Step 5: Submitting ZK Proofs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Read calldata for both players
if [ -f "calldata_bob.txt" ]; then
    BOB_CALLDATA=$(cat calldata_bob.txt)
else
    echo "❌ Error: calldata_bob.txt not found"
    exit 1
fi

if [ -f "calldata_alice.txt" ]; then
    ALICE_CALLDATA=$(cat calldata_alice.txt)
else
    echo "❌ Error: calldata_alice.txt not found"
    exit 1
fi

cd contracts

# Step 5.1: Bob submits proof
echo "📤 Step 5.1: Bob submits round proof"
if [ "$BOB_CALLDATA" == "0" ]; then
    echo "⚠️  Bob's proof is invalid (calldata = 0)"
    # Submit empty proof or handle invalid proof
    sozo -P bob execute \
        game_system submit_round_proof \
        $GAME_ID 0
else
    sozo -P bob execute \
        game_system submit_round_proof \
        $GAME_ID $BOB_CALLDATA
fi

echo "✅ Bob's proof submitted!"
echo ""

sleep 35

# Step 5.2: Alice submits proof
echo "📤 Step 5.2: Alice submits round proof"
if [ "$ALICE_CALLDATA" == "0" ]; then
    echo "⚠️  Alice's proof is invalid (calldata = 0)"
    # Submit empty proof or handle invalid proof
    sozo -P alice execute \
        game_system submit_round_proof \
        $GAME_ID 0
else
    sozo -P alice execute \
        game_system submit_round_proof \
        $GAME_ID $ALICE_CALLDATA
fi

echo "✅ Alice's proof submitted!"
echo "🎯 Game complete! Checking results..."
echo ""

cd "$PROJECT_ROOT"

echo "╔═══════════════════════════════════╗"
echo "║  ✨ Game Flow Completed!          ║"
echo "╔═══════════════════════════════════╗"
echo ""
echo "Summary:"
echo "  - Bob's hand: [$P1_CARD1_VALUE♠$P1_CARD1_SUIT, $P1_CARD2_VALUE♠$P1_CARD2_SUIT, $P1_CARD3_VALUE♠$P1_CARD3_SUIT]"
echo "  - Alice's hand: [$P2_CARD1_VALUE♠$P2_CARD1_SUIT, $P2_CARD2_VALUE♠$P2_CARD2_SUIT, $P2_CARD3_VALUE♠$P2_CARD3_SUIT]"
echo "  - Bob's condition choice: $P1_CONDITION_CHOICE"
echo "  - Alice's condition choice: $P2_CONDITION_CHOICE"
echo "  - Bob's challenge choice: $P1_CHALLENGE_CHOICE"
echo "  - Alice's challenge choice: $P2_CHALLENGE_CHOICE"
echo "  - Bob's proof valid: $([ "$BOB_CALLDATA" != "0" ] && echo "Yes" || echo "No")"
echo "  - Alice's proof valid: $([ "$ALICE_CALLDATA" != "0" ] && echo "Yes" || echo "No")"
echo ""
echo "Check the game state on-chain to see the final results!"
echo ""
