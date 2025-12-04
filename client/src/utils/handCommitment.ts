import { poseidonHashBN254, init as initGaraga } from "garaga";

/**
 * Card representation matching the Noir circuit
 */
export type Card = {
  suit: number; // 1-4 (Clubs, Spades, Diamonds, Hearts)
  value: number; // 1-13 (A, 2-10, J, Q, K)
};

/**
 * Poseidon hash wrapper with automatic Garaga initialization
 * Uses https://github.com/keep-starknet-strange/garaga
 */
async function hash(a: bigint, b: bigint): Promise<bigint> {
  try {
    return poseidonHashBN254(a, b);
  } catch (error) {
    // If it fails, initialize Garaga and try again
    await initGaraga();
    try {
      return poseidonHashBN254(a, b);
    } catch (error) {
      console.error("[handCommitment] Failed hashing with garaga:", error);
      throw error;
    }
  }
}

/**
 * Pack a card into a single Field element
 * Matches the Noir implementation: value * 256 + suit
 */
const packCard = (value: number, suit: number): bigint => {
  return BigInt(value) * BigInt(256) + BigInt(suit);
};

/**
 * Calculate the Poseidon hash commitment for a hand of 3 cards
 * Matches the Noir circuit implementation:
 * 1. Pack each card (value * 256 + suit)
 * 2. Hash first two cards: temp = hash(card1, card2)
 * 3. Hash temp with third card: final = hash(temp, card3)
 *
 * @param hand Array of 3 cards [card1, card2, card3]
 * @returns Poseidon hash as a bigint (u256)
 */
export const calculateHandCommitment = async (hand: Card[]): Promise<bigint> => {
  if (hand.length !== 3) {
    throw new Error("Hand must contain exactly 3 cards");
  }

  console.log("[handCommitment] Calculating commitment for hand:", hand);

  try {
    // Pack each card
    const card1 = packCard(hand[0].value, hand[0].suit);
    const card2 = packCard(hand[1].value, hand[1].suit);
    const card3 = packCard(hand[2].value, hand[2].suit);

    console.log("[handCommitment] Packed cards:", {
      card1: card1.toString(),
      card2: card2.toString(),
      card3: card3.toString(),
    });

    // Hash first two cards using wrapper with auto-init
    const temp = await hash(card1, card2);
    console.log("[handCommitment] temp hash (card1 + card2):", temp.toString());

    // Hash temp with third card
    const finalHash = await hash(temp, card3);
    console.log("[handCommitment] final hash:", finalHash.toString());

    return finalHash;
  } catch (error) {
    console.error("[handCommitment] Error calculating commitment:", error);
    throw new Error(`Failed to compute Poseidon hash: ${error}`);
  }
};

/**
 * Convert a hand to a hex string suitable for contract calls
 */
export const handCommitmentToHex = (commitment: bigint): string => {
  return `0x${commitment.toString(16)}`;
};
