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
 * Example hook: Subscribe to Game model updates from Torii
 */
export const useGameSubscription = (gameId: number) => {
  const { sdk } = useDojoSdk();
  const [game, setGame] = useState<Game | null>(null);
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
      if (error || !data || data.length === 0) return;

      const entity = data[0];
      if (!entity.models[NAMESPACE]?.["Game"]) return;

      const gameData = entity.models[NAMESPACE]["Game"] as Game;
      setGame(gameData);
    },
    []
  );

  useEffect(() => {
    if (!sdk) return;

    const query = gameQuery();

    const subscribe = async () => {
      const [result, subscription] = await sdk.subscribeEntityQuery({
        query,
        callback: onUpdate,
      });

      subscriptionRef.current = subscription;

      // Set initial data
      const items = result.getItems();
      if (items && items.length > 0) {
        onUpdate({ data: items, error: undefined });
      }
    };

    subscribe();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.cancel();
      }
    };
  }, [sdk, gameQuery, onUpdate]);

  return {
    game,
  };
};

