import { useCallback, useEffect, useState } from "react";
import { useDojoSdk } from "../dojo";
import type { Game } from "@/bindings/typescript/models.gen";
import { ModelsMapping } from "@/bindings/typescript/models.gen";

/**
 * Example hook: Query a Game model from Torii
 */
export const useGameQuery = (gameId: number) => {
  const { sdk } = useDojoSdk();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);

  const queryGame = useCallback(async () => {
    if (!sdk) return;

    setLoading(true);
    try {
      const modelName = ModelsMapping.Game;
      const key = `0x${gameId.toString(16).padStart(16, "0")}`;

      const result = await sdk.client.getModelValue({
        model: modelName,
        keys: [key],
      });

      if (result) {
        setGame(result as Game);
      }
    } catch (error) {
      console.error("Error querying game:", error);
    } finally {
      setLoading(false);
    }
  }, [sdk, gameId]);

  // Auto-query on mount
  useEffect(() => {
    if (!game && !loading && sdk) {
      queryGame();
    }
  }, [game, loading, sdk, queryGame]);

  return {
    game,
    loading,
    queryGame,
  };
};

