import { useParams } from "react-router-dom";
import { useAccount } from "@starknet-react/core";
import { Button } from "@/components/ui/button";
import { useGameQuery } from "@/hooks/examples/useGameQuery";
import { useGameSubscription } from "@/hooks/examples/useGameSubscription";
import { useGameCall } from "@/hooks/examples/useGameCall";
import { useGameExecute } from "@/hooks/examples/useGameExecute";
import { useGameModels } from "@/hooks/useGameModels";
import "./Game.css";

export const Game = () => {
  const { game_id } = useParams<{ game_id: string }>();
  const { account } = useAccount();
  const gameId = game_id ? parseInt(game_id) : 0;

  // Example: Query to Torii
  const { game: queriedGame, loading: queryLoading } = useGameQuery(gameId);

  // Example: Subscription to Game model
  const { game: subscribedGame } = useGameSubscription(gameId);

  // Example: Call to contract
  const { callGame, callLoading } = useGameCall();

  // Example: Execute to contract
  const { executeCreateGame, executeLoading } = useGameExecute();

  // Subscribe to all game models
  const {
    game,
    condition,
    playerConditionChoice,
    playerChallengeChoice,
    roundProof,
  } = useGameModels(gameId);

  if (!account) {
    return (
      <div className="game-wallet-message">
        <div className="game-wallet-message-text">Please connect your wallet</div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-wrapper">
        <h1 className="game-title">Game #{gameId}</h1>

        {/* Examples Section */}
        <div className="game-examples-grid">
          {/* Example 1: Torii Query */}
          <div className="game-example-card">
            <h2 className="game-example-title">Example 1: Torii Query</h2>
            <Button
              onClick={() => {}}
              disabled={queryLoading}
              className="game-example-button"
            >
              {queryLoading ? "Loading..." : "Query Game"}
            </Button>
            {queriedGame && (
              <div className="game-example-result">
                <pre>{JSON.stringify(queriedGame, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Example 2: Torii Subscription */}
          <div className="game-example-card">
            <h2 className="game-example-title">Example 2: Torii Subscription</h2>
            <p className="game-example-description">
              Subscribed to Game model updates
            </p>
            {subscribedGame && (
              <div className="game-example-result">
                <pre>{JSON.stringify(subscribedGame, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Example 3: Contract Call */}
          <div className="game-example-card">
            <h2 className="game-example-title">Example 3: Contract Call</h2>
            <Button
              onClick={() => callGame(gameId)}
              disabled={callLoading}
              className="game-example-button"
            >
              {callLoading ? "Calling..." : "Call Game (Read)"}
            </Button>
            <p className="game-example-description">
              This is a read-only call to the contract
            </p>
          </div>

          {/* Example 4: Contract Execute */}
          <div className="game-example-card">
            <h2 className="game-example-title">Example 4: Contract Execute</h2>
            <Button
              onClick={() => executeCreateGame("Player1")}
              disabled={executeLoading}
              className="game-example-button"
            >
              {executeLoading ? "Executing..." : "Create Game (Execute)"}
            </Button>
            <p className="game-example-description">
              This executes a transaction on the contract
            </p>
          </div>
        </div>

        {/* Game State Section */}
        <div className="game-state-section">
          <h2 className="game-state-title">
            Game State (Subscribed to all models)
          </h2>
          <div className="game-state-grid">
            {game && (
              <div className="game-state-card">
                <h3 className="game-state-card-title">Game</h3>
                <pre className="game-state-card-content">
                  {JSON.stringify(game, null, 2)}
                </pre>
              </div>
            )}
            {condition && (
              <div className="game-state-card">
                <h3 className="game-state-card-title">Condition</h3>
                <pre className="game-state-card-content">
                  {JSON.stringify(condition, null, 2)}
                </pre>
              </div>
            )}
            {playerConditionChoice && (
              <div className="game-state-card">
                <h3 className="game-state-card-title">
                  Player Condition Choice
                </h3>
                <pre className="game-state-card-content">
                  {JSON.stringify(playerConditionChoice, null, 2)}
                </pre>
              </div>
            )}
            {playerChallengeChoice && (
              <div className="game-state-card">
                <h3 className="game-state-card-title">
                  Player Challenge Choice
                </h3>
                <pre className="game-state-card-content">
                  {JSON.stringify(playerChallengeChoice, null, 2)}
                </pre>
              </div>
            )}
            {roundProof && (
              <div className="game-state-card">
                <h3 className="game-state-card-title">Round Proof</h3>
                <pre className="game-state-card-content">
                  {JSON.stringify(roundProof, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
