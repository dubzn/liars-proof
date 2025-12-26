import { useEffect, useState } from "react";
import type { RoundProof } from "@/bindings/typescript/models.gen";

const TORII_URL = import.meta.env.VITE_ZN_SEPOLIA_TORII_URL;
const GRAPHQL_URL = `${TORII_URL}/graphql`;

interface RoundProofData {
  player1Proof: RoundProof | null;
  player2Proof: RoundProof | null;
}

/**
 * Hook that fetches and watches round proofs for both players using GraphQL
 * Only polls when shouldPoll is true (when game is in ResultPhase)
 * Polls every 2 seconds to detect changes
 */
export const useRoundProofGraphQL = (
  gameId: number,
  round: number,
  player1Address: string | undefined,
  player2Address: string | undefined,
  shouldPoll: boolean = false,
) => {
  const [proofs, setProofs] = useState<RoundProofData>({
    player1Proof: null,
    player2Proof: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Don't fetch if we shouldn't poll or if we don't have the necessary data
    if (!shouldPoll || gameId === 0 || !player1Address) {
      setIsLoading(false);
      return;
    }

    const fetchProofs = async () => {
      try {
        // Fetch player 1 proof
        const player1Query = `
          query {
            liarsProof3RoundProofModels(
              where: {
                game_id: ${gameId},
                round: ${round},
                player: "${player1Address}"
              }
            ) {
              edges {
                node {
                  game_id
                  round
                  player
                  submitted
                  is_valid
                }
              }
            }
          }
        `;

        const player1Response = await fetch(GRAPHQL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: player1Query }),
        });

        if (!player1Response.ok) {
          throw new Error(`HTTP error! status: ${player1Response.status}`);
        }

        const player1Result = await player1Response.json();

        if (player1Result.errors) {
          throw new Error(player1Result.errors[0].message);
        }

        const player1Edges =
          player1Result.data?.liarsProof3RoundProofModels?.edges;
        const player1Proof =
          player1Edges && player1Edges.length > 0
            ? (player1Edges[0].node as RoundProof)
            : null;

        // Fetch player 2 proof if player2Address is provided
        let player2Proof: RoundProof | null = null;
        if (player2Address) {
          const player2Query = `
            query {
              liarsProof3RoundProofModels(
                where: {
                  game_id: ${gameId},
                  round: ${round},
                  player: "${player2Address}"
                }
              ) {
                edges {
                  node {
                    game_id
                    round
                    player
                    submitted
                    is_valid
                  }
                }
              }
            }
          `;

          const player2Response = await fetch(GRAPHQL_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: player2Query }),
          });

          if (player2Response.ok) {
            const player2Result = await player2Response.json();
            const player2Edges =
              player2Result.data?.liarsProof3RoundProofModels?.edges;
            player2Proof =
              player2Edges && player2Edges.length > 0
                ? (player2Edges[0].node as RoundProof)
                : null;
          }
        }

        setProofs({
          player1Proof,
          player2Proof,
        });

        setIsLoading(false);
      } catch (err) {
        console.error(
          `[useRoundProofGraphQL] ❌ Error fetching proofs for game ${gameId}, round ${round}:`,
          err,
        );
        setError(err as Error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchProofs();

    // Poll for updates every 2 seconds only if shouldPoll is true
    const interval = setInterval(fetchProofs, 2000);

    return () => clearInterval(interval);
  }, [gameId, round, player1Address, player2Address, shouldPoll]);

  return {
    proofs,
    isLoading,
    error,
    player1ProofSubmitted: proofs.player1Proof?.submitted || false,
    player1ProofValid: proofs.player1Proof?.is_valid || false,
    player2ProofSubmitted: proofs.player2Proof?.submitted || false,
    player2ProofValid: proofs.player2Proof?.is_valid || false,
  };
};
