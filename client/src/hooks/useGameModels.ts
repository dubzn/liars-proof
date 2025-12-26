import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClauseBuilder,
  type SchemaType,
  type StandardizedQueryResult,
  type SubscriptionCallbackArgs,
  ToriiQueryBuilder,
} from "@dojoengine/sdk";
import { useDojoSdk } from "./dojo";
import type {
  Game,
  Condition,
  PlayerConditionChoice,
  PlayerChallengeChoice,
  RoundProof,
} from "@/bindings/typescript/models.gen";
import { ModelsMapping } from "@/bindings/typescript/models.gen";

const NAMESPACE = "dojo_starter";

/**
 * Hook to subscribe to all game-related models that update in the game system
 */
export const useGameModels = (gameId: number) => {
  const { sdk } = useDojoSdk();
  const [game, setGame] = useState<Game | null>(null);
  const [condition, setCondition] = useState<Condition | null>(null);
  const [playerConditionChoice, setPlayerConditionChoice] =
    useState<PlayerConditionChoice | null>(null);
  const [playerChallengeChoice, setPlayerChallengeChoice] =
    useState<PlayerChallengeChoice | null>(null);
  const [roundProof, setRoundProof] = useState<RoundProof | null>(null);

  const subscriptionsRef = useRef<any[]>([]);

  // Build query for Game model
  const buildGameQuery = useCallback(() => {
    const model = ModelsMapping.Game;
    const key = `0x${gameId.toString(16).padStart(16, "0")}`;
    const clauses = new ClauseBuilder().keys([model], [key], "FixedLen");
    return new ToriiQueryBuilder()
      .withClause(clauses.build())
      .includeHashedKeys()
      .withLimit(1);
  }, [gameId]);

  // Build query for Condition model (using condition_id from game)
  const buildConditionQuery = useCallback((conditionId: number) => {
    const model = ModelsMapping.Condition;
    const key = `0x${conditionId.toString(16).padStart(16, "0")}`;
    const clauses = new ClauseBuilder().keys([model], [key], "FixedLen");
    return new ToriiQueryBuilder()
      .withClause(clauses.build())
      .includeHashedKeys()
      .withLimit(1);
  }, []);

  // Build query for PlayerConditionChoice
  const buildPlayerConditionChoiceQuery = useCallback(
    (round: number, player: string) => {
      const model = ModelsMapping.PlayerConditionChoice;
      const gameKey = `0x${gameId.toString(16).padStart(16, "0")}`;
      const roundKey = `0x${round.toString(16).padStart(16, "0")}`;
      const clauses = new ClauseBuilder().keys(
        [model],
        [gameKey, roundKey, player],
        "FixedLen",
      );
      return new ToriiQueryBuilder()
        .withClause(clauses.build())
        .includeHashedKeys()
        .withLimit(1);
    },
    [gameId],
  );

  // Build query for PlayerChallengeChoice
  const buildPlayerChallengeChoiceQuery = useCallback(
    (round: number, player: string) => {
      const model = ModelsMapping.PlayerChallengeChoice;
      const gameKey = `0x${gameId.toString(16).padStart(16, "0")}`;
      const roundKey = `0x${round.toString(16).padStart(16, "0")}`;
      const clauses = new ClauseBuilder().keys(
        [model],
        [gameKey, roundKey, player],
        "FixedLen",
      );
      return new ToriiQueryBuilder()
        .withClause(clauses.build())
        .includeHashedKeys()
        .withLimit(1);
    },
    [gameId],
  );

  // Build query for RoundProof
  const buildRoundProofQuery = useCallback(
    (round: number, player: string) => {
      const model = ModelsMapping.RoundProof;
      const gameKey = `0x${gameId.toString(16).padStart(16, "0")}`;
      const roundKey = `0x${round.toString(16).padStart(16, "0")}`;
      const clauses = new ClauseBuilder().keys(
        [model],
        [gameKey, roundKey, player],
        "FixedLen",
      );
      return new ToriiQueryBuilder()
        .withClause(clauses.build())
        .includeHashedKeys()
        .withLimit(1);
    },
    [gameId],
  );

  // Subscribe to Game model
  useEffect(() => {
    if (!sdk) return;

    const query = buildGameQuery();

    const onGameUpdate = ({
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

      // Subscribe to condition when game updates
      if (gameData.condition_id) {
        const conditionId = Number(gameData.condition_id);
        if (conditionId > 0) {
          const conditionQuery = buildConditionQuery(conditionId);
          sdk.subscribeEntityQuery({
            query: conditionQuery,
            callback: ({
              data,
              error,
            }: SubscriptionCallbackArgs<
              StandardizedQueryResult<SchemaType>,
              Error
            >) => {
              if (error || !data || data.length === 0) return;
              const entity = data[0];
              if (!entity.models[NAMESPACE]?.["Condition"]) return;
              const conditionData = entity.models[NAMESPACE][
                "Condition"
              ] as Condition;
              setCondition(conditionData);
            },
          });
        }
      }

      // Subscribe to player choices and proofs for current round
      const round = Number(gameData.round);
      if (round > 0) {
        const player1 = gameData.player_1;
        const player2 = gameData.player_2;

        // Subscribe to condition choices
        if (player1) {
          const query1 = buildPlayerConditionChoiceQuery(round, player1);
          sdk.subscribeEntityQuery({
            query: query1,
            callback: ({
              data,
              error,
            }: SubscriptionCallbackArgs<
              StandardizedQueryResult<SchemaType>,
              Error
            >) => {
              if (error || !data || data.length === 0) return;
              const entity = data[0];
              if (!entity.models[NAMESPACE]?.["PlayerConditionChoice"]) return;
              const choice = entity.models[NAMESPACE][
                "PlayerConditionChoice"
              ] as PlayerConditionChoice;
              setPlayerConditionChoice(choice);
            },
          });
        }

        // Subscribe to challenge choices
        if (player1) {
          const query1 = buildPlayerChallengeChoiceQuery(round, player1);
          sdk.subscribeEntityQuery({
            query: query1,
            callback: ({
              data,
              error,
            }: SubscriptionCallbackArgs<
              StandardizedQueryResult<SchemaType>,
              Error
            >) => {
              if (error || !data || data.length === 0) return;
              const entity = data[0];
              if (!entity.models[NAMESPACE]?.["PlayerChallengeChoice"]) return;
              const choice = entity.models[NAMESPACE][
                "PlayerChallengeChoice"
              ] as PlayerChallengeChoice;
              setPlayerChallengeChoice(choice);
            },
          });
        }

        // Subscribe to round proofs
        if (player1) {
          const query1 = buildRoundProofQuery(round, player1);
          sdk.subscribeEntityQuery({
            query: query1,
            callback: ({
              data,
              error,
            }: SubscriptionCallbackArgs<
              StandardizedQueryResult<SchemaType>,
              Error
            >) => {
              if (error || !data || data.length === 0) return;
              const entity = data[0];
              if (!entity.models[NAMESPACE]?.["RoundProof"]) return;
              const proof = entity.models[NAMESPACE][
                "RoundProof"
              ] as RoundProof;
              setRoundProof(proof);
            },
          });
        }
      }
    };

    const subscribe = async () => {
      const [result, subscription] = await sdk.subscribeEntityQuery({
        query,
        callback: onGameUpdate,
      });

      subscriptionsRef.current.push(subscription);

      // Set initial data
      const items = result.getItems();
      if (items && items.length > 0) {
        onGameUpdate({ data: items, error: undefined });
      }
    };

    subscribe();

    return () => {
      subscriptionsRef.current.forEach((sub) => {
        if (sub) sub.cancel();
      });
      subscriptionsRef.current = [];
    };
  }, [
    sdk,
    buildGameQuery,
    buildConditionQuery,
    buildPlayerConditionChoiceQuery,
    buildPlayerChallengeChoiceQuery,
    buildRoundProofQuery,
  ]);

  return {
    game,
    condition,
    playerConditionChoice,
    playerChallengeChoice,
    roundProof,
  };
};
