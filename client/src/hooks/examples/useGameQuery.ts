import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClauseBuilder,
  type SchemaType,
  type StandardizedQueryResult,
  type SubscriptionCallbackArgs,
  ToriiQueryBuilder,
} from "@dojoengine/sdk";
import { useDojoSdk } from "../dojo";
import type { Game } from "@/bindings/typescript/models.gen";
import { ModelsMapping } from "@/bindings/typescript/models.gen";

const NAMESPACE = "dojo_starter";

/**
 * Example hook: Query and subscribe to Game model from Torii
 * Automatically updates when the model changes
 */
export const useGameQuery = (gameId: number) => {
  const { sdk } = useDojoSdk();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const subscriptionRef = useRef<any>(null);

  const gameQuery = useCallback(() => {
    const model = ModelsMapping.Game;
    const key = `0x${gameId.toString(16).padStart(16, "0")}`;
    const clauses = new ClauseBuilder().keys([model], [key], "FixedLen");
    return new ToriiQueryBuilder()
      .withClause(clauses.build())
      .includeHashedKeys()
      .withLimit(1);
  }, [gameId]);

  const onUpdate = useCallback(
    ({
      data,
      error,
    }: SubscriptionCallbackArgs<
      StandardizedQueryResult<SchemaType>,
      Error
    >) => {
      if (error || !data || data.length === 0) {
        setGame(null);
        return;
      }

      const entity = data[0];
      if (!entity.models[NAMESPACE]?.["Game"]) {
        setGame(null);
        return;
      }

      const gameData = entity.models[NAMESPACE]["Game"] as Game;
      setGame(gameData);
    },
    []
  );

  // Subscribe to model updates
  useEffect(() => {
    if (!sdk) return;

    setLoading(true);
    const query = gameQuery();

    const subscribe = async () => {
      try {
        const [result, subscription] = await sdk.subscribeEntityQuery({
          query,
          callback: onUpdate,
        });

        subscriptionRef.current = subscription;

        // Set initial data
        const items = result.getItems();
        if (items && items.length > 0) {
          onUpdate({ data: items, error: undefined });
        } else {
          setGame(null);
        }
      } catch (error) {
        console.error("Error subscribing to game:", error);
        setGame(null);
      } finally {
        setLoading(false);
      }
    };

    subscribe();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.cancel();
        subscriptionRef.current = null;
      }
    };
  }, [sdk, gameQuery, onUpdate]);

  // Manual refresh function
  const queryGame = useCallback(async () => {
    if (!sdk) return;

    setLoading(true);
    try {
      const query = gameQuery();
      const [result] = await sdk.subscribeEntityQuery({
        query,
        callback: onUpdate,
      });

      const items = result.getItems();
      if (items && items.length > 0) {
        onUpdate({ data: items, error: undefined });
      } else {
        setGame(null);
      }
    } catch (error) {
      console.error("Error querying game:", error);
      setGame(null);
    } finally {
      setLoading(false);
    }
  }, [sdk, gameQuery, onUpdate]);

  return {
    game,
    loading,
    queryGame,
  };
};

