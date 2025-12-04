/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";
import { calculateHandCommitment, handCommitmentToHex, type Card } from "./handCommitment";

describe("calculateHandCommitment", () => {
  it("should calculate the correct hash for a given hand", async () => {
    // Test case from Noir circuit execution
    // Input from Prover.toml:
    // card1_suit = "2", card1_value = "11"
    // card2_suit = "3", card2_value = "3"
    // card3_suit = "4", card3_value = "9"
    const hand: Card[] = [
      { suit: 2, value: 11 },  // Jack of suit 2
      { suit: 3, value: 3 },   // 3 of suit 3
      { suit: 4, value: 9 },   // 9 of suit 4
    ];

    const commitment = await calculateHandCommitment(hand);
    const expectedHash = BigInt("0x14d4163347ce7b867649920f760cbe4cd95f39bf7c0d741080b05e6c973b8b57");

    expect(commitment).toBe(expectedHash);
  });

  it("should convert commitment to hex string correctly", async () => {
    const hand: Card[] = [
      { suit: 2, value: 11 },
      { suit: 3, value: 3 },
      { suit: 4, value: 9 },
    ];

    const commitment = await calculateHandCommitment(hand);
    const hexString = handCommitmentToHex(commitment);

    expect(hexString).toBe("0x14d4163347ce7b867649920f760cbe4cd95f39bf7c0d741080b05e6c973b8b57");
  });

  it("should throw error for invalid hand size", async () => {
    const invalidHand: Card[] = [
      { suit: 1, value: 1 },
      { suit: 2, value: 2 },
    ];

    await expect(calculateHandCommitment(invalidHand)).rejects.toThrow(
      "Hand must contain exactly 3 cards"
    );
  });

  it("should produce different hashes for different hands", async () => {
    const hand1: Card[] = [
      { suit: 1, value: 1 },
      { suit: 2, value: 2 },
      { suit: 3, value: 3 },
    ];

    const hand2: Card[] = [
      { suit: 2, value: 11 },
      { suit: 3, value: 3 },
      { suit: 4, value: 9 },
    ];

    const commitment1 = await calculateHandCommitment(hand1);
    const commitment2 = await calculateHandCommitment(hand2);

    expect(commitment1).not.toBe(commitment2);
  });

  it("should produce the same hash for the same hand (deterministic)", async () => {
    const hand: Card[] = [
      { suit: 2, value: 11 },
      { suit: 3, value: 3 },
      { suit: 4, value: 9 },
    ];

    const commitment1 = await calculateHandCommitment(hand);
    const commitment2 = await calculateHandCommitment(hand);

    expect(commitment1).toBe(commitment2);
  });
});
