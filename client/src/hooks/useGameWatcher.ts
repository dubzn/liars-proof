import { useEffect, useRef } from "react";
import { useGameGraphQL } from "./useGameGraphQL";
import type { Game } from "@/bindings/typescript/models.gen";

/**
 * Hook that watches for changes in a specific game using GraphQL polling
 * Only logs and calls callback when actual field changes are detected
 *
 * @param gameId The ID of the game to watch
 * @param onGameChange Optional callback that fires when the game changes
 *
 * @example
 * ```tsx
 * useGameWatcher(gameId, (game) => {
 *   console.log("Game changed!", game);
 * });
 * ```
 */
export const useGameWatcher = (
  gameId: number,
  onGameChange?: (game: Game) => void
) => {
  const { game, isLoading } = useGameGraphQL(gameId);
  const previousGameRef = useRef<Game | null>(null);

  // Watch for changes in the game model
  useEffect(() => {
    if (!game) {
      return;
    }

    const previousGame = previousGameRef.current;

    // Skip if this is the first time we're seeing the game (initialization)
    if (!previousGame) {
      previousGameRef.current = game;
      console.log(`[useGameWatcher] 🎮 Initial game state loaded for game ${gameId}:`, {
        id: game.id,
        player_1_name: game.player_1_name,
        player_2_name: game.player_2_name,
        state: game.state,
        round: game.round,
      });
      return;
    }

    // Compare each field to detect changes
    const changes: Record<string, { old: any; new: any }> = {};

    if (game.player_1 !== previousGame.player_1) {
      changes.player_1 = { old: previousGame.player_1, new: game.player_1 };
    }
    if (game.player_1_name !== previousGame.player_1_name) {
      changes.player_1_name = { old: previousGame.player_1_name, new: game.player_1_name };
    }
    if (game.player_2 !== previousGame.player_2) {
      changes.player_2 = { old: previousGame.player_2, new: game.player_2 };
    }
    if (game.player_2_name !== previousGame.player_2_name) {
      changes.player_2_name = { old: previousGame.player_2_name, new: game.player_2_name };
    }
    if (game.state !== previousGame.state) {
      changes.state = { old: previousGame.state, new: game.state };
    }
    if (game.round !== previousGame.round) {
      changes.round = { old: previousGame.round, new: game.round };
    }
    if (game.player_1_lives !== previousGame.player_1_lives) {
      changes.player_1_lives = { old: previousGame.player_1_lives, new: game.player_1_lives };
    }
    if (game.player_2_lives !== previousGame.player_2_lives) {
      changes.player_2_lives = { old: previousGame.player_2_lives, new: game.player_2_lives };
    }
    if (game.player_1_score !== previousGame.player_1_score) {
      changes.player_1_score = { old: previousGame.player_1_score, new: game.player_1_score };
    }
    if (game.player_2_score !== previousGame.player_2_score) {
      changes.player_2_score = { old: previousGame.player_2_score, new: game.player_2_score };
    }
    if (game.player_1_hand_commitment !== previousGame.player_1_hand_commitment) {
      changes.player_1_hand_commitment = { old: previousGame.player_1_hand_commitment, new: game.player_1_hand_commitment };
    }
    if (game.player_2_hand_commitment !== previousGame.player_2_hand_commitment) {
      changes.player_2_hand_commitment = { old: previousGame.player_2_hand_commitment, new: game.player_2_hand_commitment };
    }
    if (game.condition_id !== previousGame.condition_id) {
      changes.condition_id = { old: previousGame.condition_id, new: game.condition_id };
    }
    // Condition choice fields
    if (game.player_1_condition_submitted !== previousGame.player_1_condition_submitted) {
      changes.player_1_condition_submitted = { old: previousGame.player_1_condition_submitted, new: game.player_1_condition_submitted };
    }
    if (game.player_1_condition_choice !== previousGame.player_1_condition_choice) {
      changes.player_1_condition_choice = { old: previousGame.player_1_condition_choice, new: game.player_1_condition_choice };
    }
    if (game.player_2_condition_submitted !== previousGame.player_2_condition_submitted) {
      changes.player_2_condition_submitted = { old: previousGame.player_2_condition_submitted, new: game.player_2_condition_submitted };
    }
    if (game.player_2_condition_choice !== previousGame.player_2_condition_choice) {
      changes.player_2_condition_choice = { old: previousGame.player_2_condition_choice, new: game.player_2_condition_choice };
    }
    // Challenge choice fields
    if (game.player_1_challenge_submitted !== previousGame.player_1_challenge_submitted) {
      changes.player_1_challenge_submitted = { old: previousGame.player_1_challenge_submitted, new: game.player_1_challenge_submitted };
    }
    if (game.player_1_challenge_choice !== previousGame.player_1_challenge_choice) {
      changes.player_1_challenge_choice = { old: previousGame.player_1_challenge_choice, new: game.player_1_challenge_choice };
    }
    if (game.player_2_challenge_submitted !== previousGame.player_2_challenge_submitted) {
      changes.player_2_challenge_submitted = { old: previousGame.player_2_challenge_submitted, new: game.player_2_challenge_submitted };
    }
    if (game.player_2_challenge_choice !== previousGame.player_2_challenge_choice) {
      changes.player_2_challenge_choice = { old: previousGame.player_2_challenge_choice, new: game.player_2_challenge_choice };
    }

    // Only log and trigger callback if there are actual changes
    if (Object.keys(changes).length > 0) {
      console.log("🔥 GAME CHANGE DETECTED 🔥");
      console.log(`Game ID: ${gameId}`);
      console.log("Changed fields:", changes);
      console.log("Full game state:", game);

      // Update the reference
      previousGameRef.current = game;

      // Call custom callback if provided
      if (onGameChange) {
        onGameChange(game);
      }
    }
  }, [
    gameId,
    game,
    onGameChange,
  ]);

  return { game, isLoading };
};
