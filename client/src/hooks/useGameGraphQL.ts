import { useEffect, useState } from "react";
import type { Game } from "@/bindings/typescript/models.gen";

const TORII_URL = import.meta.env.VITE_ZN_SEPOLIA_TORII_URL;
const GRAPHQL_URL = `${TORII_URL}/graphql`;

/**
 * Hook that fetches and watches a game using GraphQL directly
 * Polls every 2 seconds to detect changes
 */
export const useGameGraphQL = (gameId: number) => {
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (gameId === 0) {
      setIsLoading(false);
      return;
    }

    const fetchGame = async () => {
      try {
        const query = `
          query {
            liarsProof3GameModels(where: { id: ${gameId} }) {
              edges {
                node {
                  id
                  player_1
                  player_1_name
                  player_2
                  player_2_name
                  player_1_hand_commitment
                  player_2_hand_commitment
                  player_1_score
                  player_2_score
                  player_1_lives
                  player_2_lives
                  round
                  state
                  condition_id
                  player_1_condition_submitted
                  player_1_condition_choice
                  player_2_condition_submitted
                  player_2_condition_choice
                  player_1_challenge_submitted
                  player_1_challenge_choice
                  player_2_challenge_submitted
                  player_2_challenge_choice
                }
              }
            }
          }
        `;

        const response = await fetch(GRAPHQL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        const edges = result.data?.liarsProof3GameModels?.edges;
        if (edges && edges.length > 0) {
          const gameData = edges[0].node;
          setGame(gameData as Game);
        } else {
          console.log(`[useGameGraphQL] ⚠️ No game found with ID ${gameId}`);
          setGame(null);
        }

        setIsLoading(false);
      } catch (err) {
        console.error(
          `[useGameGraphQL] ❌ Error fetching game ${gameId}:`,
          err,
        );
        setError(err as Error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchGame();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchGame, 2000);

    return () => clearInterval(interval);
  }, [gameId]);

  return { game, isLoading, error };
};
