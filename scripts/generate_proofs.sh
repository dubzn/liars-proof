#!/bin/bash

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

CONFIG_FILE="${1:-game_config.toml}"

# If CONFIG_FILE is not an absolute path, look for it in project root
if [[ "$CONFIG_FILE" != /* ]]; then
    CONFIG_FILE="$PROJECT_ROOT/$CONFIG_FILE"
fi

echo "==================================="
echo "🔐 Generating ZK Proofs"
echo "==================================="
echo ""
echo "Using config file: $CONFIG_FILE"
echo ""

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file '$CONFIG_FILE' not found"
    exit 1
fi

# Change to project root directory
cd "$PROJECT_ROOT"

# Function to read TOML values
read_toml() {
    local key=$1
    grep "^$key" "$CONFIG_FILE" | cut -d'"' -f2
}

# Read game config
GAME_ID=$(read_toml "game_id")
COMPARATOR=$(read_toml "comparator")
CONDITION_ID=$(read_toml "condition_id")
SUIT=$(read_toml "suit")
VALUE=$(read_toml "value")

# Read player 1 config
P1_CARD1_SUIT=$(read_toml "card1_suit" | head -1)
P1_CARD1_VALUE=$(read_toml "card1_value" | head -1)
P1_CARD2_SUIT=$(read_toml "card2_suit" | head -1)
P1_CARD2_VALUE=$(read_toml "card2_value" | head -1)
P1_CARD3_SUIT=$(read_toml "card3_suit" | head -1)
P1_CARD3_VALUE=$(read_toml "card3_value" | head -1)

# Read player 2 config (second occurrence)
P2_CARD1_SUIT=$(read_toml "card1_suit" | tail -1)
P2_CARD1_VALUE=$(read_toml "card1_value" | tail -1)
P2_CARD2_SUIT=$(read_toml "card2_suit" | tail -1)
P2_CARD2_VALUE=$(read_toml "card2_value" | tail -1)
P2_CARD3_SUIT=$(read_toml "card3_suit" | tail -1)
P2_CARD3_VALUE=$(read_toml "card3_value" | tail -1)

echo "Game Configuration:"
echo "  Game ID: $GAME_ID"
echo "  Condition ID: $CONDITION_ID"
echo "  Comparator: $COMPARATOR"
echo "  Value: $VALUE"
echo "  Suit: $SUIT"
echo ""

# Function to calculate hand commitment using the hash circuit
calculate_hand_commitment() {
    local card1_value=$1
    local card1_suit=$2
    local card2_value=$3
    local card2_suit=$4
    local card3_value=$5
    local card3_suit=$6

    # Navigate to hash directory
    cd hash

    # Update Prover.toml with the hand values
    cat > Prover.toml <<HASH_PROVER
[hand]
card1_suit = "$card1_suit"
card1_value = "$card1_value"
card2_suit = "$card2_suit"
card2_value = "$card2_value"
card3_suit = "$card3_suit"
card3_value = "$card3_value"
HASH_PROVER

    # Check the circuit
    nargo check > /dev/null 2>&1

    # Execute witness and capture the hash output
    local hash_output=$(nargo execute witness 2>&1 | grep "0x" | tail -1)

    cd ..

    echo "$hash_output"
}

# Function to generate proof for a player
generate_proof() {
    local player_name=$1
    local card1_value=$2
    local card1_suit=$3
    local card2_value=$4
    local card2_suit=$5
    local card3_value=$6
    local card3_suit=$7

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "👤 Generating proof for $player_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Calculate hand commitment
    echo "📊 Calculating hand commitment..."
    HAND_COMMITMENT=$(calculate_hand_commitment $card1_value $card1_suit $card2_value $card2_suit $card3_value $card3_suit)
    echo "   Hand commitment: $HAND_COMMITMENT"
    echo ""

    # Navigate to circuit directory
    cd circuit

    # Check circuit
    echo "🔍 Checking circuit..."
    if ! nargo check; then
        echo "❌ Circuit check failed for $player_name"
        cd ..
        echo "0" > "calldata_${player_name}.txt"
        return 1
    fi
    echo ""

    # Update Prover.toml
    echo "📝 Updating Prover.toml for $player_name..."
    cat > Prover.toml <<PROVER_TOML
_game_id = "$GAME_ID"
comparator = "$COMPARATOR"
condition_id = "$CONDITION_ID"
hand_commitment = "$HAND_COMMITMENT"
suit = "$SUIT"
value = "$VALUE"

[hand]
card1_suit = "$card1_suit"
card1_value = "$card1_value"
card2_suit = "$card2_suit"
card2_value = "$card2_value"
card3_suit = "$card3_suit"
card3_value = "$card3_value"
PROVER_TOML

    # Execute witness
    echo "🎯 Executing witness generation..."
    if ! nargo execute witness; then
        echo "❌ Witness generation failed for $player_name (proof will be invalid)"
        cd ..
        echo "0" > "calldata_${player_name}.txt"
        return 1
    fi
    echo ""

    # Generate proof
    echo "🔐 Generating proof..."
    if ! bb prove --scheme ultra_honk --zk --oracle_hash starknet -b ./target/circuit.json -w ./target/witness.gz -o ./target; then
        echo "❌ Proof generation failed for $player_name"
        cd ..
        echo "0" > "calldata_${player_name}.txt"
        return 1
    fi
    echo ""

    # Write verification key
    echo "🔑 Writing verification key..."
    if ! bb write_vk --scheme ultra_honk --oracle_hash starknet -b ./target/circuit.json -o ./target; then
        echo "❌ VK generation failed for $player_name"
        cd ..
        echo "0" > "calldata_${player_name}.txt"
        return 1
    fi
    echo ""

    # Generate calldata
    echo "📋 Generating calldata..."
    cd ..

    # Activate virtual environment for garaga
    source mi_entorno/bin/activate

    if ! garaga calldata --system ultra_starknet_zk_honk --proof circuit/target/proof --vk circuit/target/vk --public-inputs circuit/target/public_inputs > "calldata_${player_name}.txt"; then
        echo "❌ Calldata generation failed for $player_name"
        echo "0" > "calldata_${player_name}.txt"
        deactivate
        return 1
    fi

    deactivate

    echo "✅ Proof generated successfully for $player_name!"
    echo "   Calldata saved to: calldata_${player_name}.txt"
    echo ""
}

# Generate proof for Player 1 (Bob)
generate_proof "bob" $P1_CARD1_VALUE $P1_CARD1_SUIT $P1_CARD2_VALUE $P1_CARD2_SUIT $P1_CARD3_VALUE $P1_CARD3_SUIT

# Generate proof for Player 2 (Alice)
generate_proof "alice" $P2_CARD1_VALUE $P2_CARD1_SUIT $P2_CARD2_VALUE $P2_CARD2_SUIT $P2_CARD3_VALUE $P2_CARD3_SUIT

echo "==================================="
echo "✨ Proof generation completed!"
echo "==================================="
echo ""
echo "Generated files:"
echo "  - calldata_bob.txt"
echo "  - calldata_alice.txt"
echo ""
