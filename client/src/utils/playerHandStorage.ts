import type { Card } from "./handCommitment";

const STORAGE_PREFIX = "liars_proof_player_hand_";

/**
 * Generate a storage key for player hand based on game_id and user_address
 */
const getStorageKey = (gameId: number, userAddress: string): string => {
  return `${STORAGE_PREFIX}${gameId}_${userAddress.toLowerCase()}`;
};

/**
 * Save player hand to localStorage
 */
export const savePlayerHand = (
  gameId: number,
  userAddress: string,
  hand: Card[],
): void => {
  try {
    const key = getStorageKey(gameId, userAddress);
    const data = JSON.stringify(hand);
    localStorage.setItem(key, data);
    console.log(
      `[playerHandStorage] 💾 Saved hand for game ${gameId}, address ${userAddress}:`,
      hand,
    );
  } catch (error) {
    console.error(
      "[playerHandStorage] ❌ Error saving hand to localStorage:",
      error,
    );
  }
};

/**
 * Load player hand from localStorage
 */
export const loadPlayerHand = (
  gameId: number,
  userAddress: string,
): Card[] | null => {
  try {
    const key = getStorageKey(gameId, userAddress);
    const data = localStorage.getItem(key);
    if (!data) {
      console.log(
        `[playerHandStorage] 📭 No saved hand found for game ${gameId}, address ${userAddress}`,
      );
      return null;
    }
    const hand = JSON.parse(data) as Card[];
    console.log(
      `[playerHandStorage] 📖 Loaded hand for game ${gameId}, address ${userAddress}:`,
      hand,
    );
    return hand;
  } catch (error) {
    console.error(
      "[playerHandStorage] ❌ Error loading hand from localStorage:",
      error,
    );
    return null;
  }
};

/**
 * Check if player hand exists in localStorage
 */
export const hasPlayerHand = (gameId: number, userAddress: string): boolean => {
  const key = getStorageKey(gameId, userAddress);
  return localStorage.getItem(key) !== null;
};

/**
 * Clear player hand from localStorage (useful for testing or reset)
 */
export const clearPlayerHand = (gameId: number, userAddress: string): void => {
  try {
    const key = getStorageKey(gameId, userAddress);
    localStorage.removeItem(key);
    console.log(
      `[playerHandStorage] 🗑️ Cleared hand for game ${gameId}, address ${userAddress}`,
    );
  } catch (error) {
    console.error(
      "[playerHandStorage] ❌ Error clearing hand from localStorage:",
      error,
    );
  }
};
