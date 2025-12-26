import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGameGraphQL } from "@/hooks/useGameGraphQL";
import "./JoinGameModal.css";

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (gameId: number) => Promise<void>;
}

export const JoinGameModal = ({
  isOpen,
  onClose,
  onJoin,
}: JoinGameModalProps) => {
  const [gameIdInput, setGameIdInput] = useState("");
  const [gameId, setGameId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use useGameGraphQL to check if game exists
  const { game, isLoading, error: graphqlError } = useGameGraphQL(gameId || 0);

  // When game is found, call onJoin
  useEffect(() => {
    if (game && gameId) {
      onJoin(gameId);
      setGameIdInput("");
      setGameId(null);
      onClose();
    }
  }, [game, gameId, onJoin, onClose]);

  // Handle GraphQL errors
  useEffect(() => {
    if (graphqlError && gameId) {
      setError(`Game with ID ${gameId} not found`);
      setGameId(null);
    }
  }, [graphqlError, gameId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const id = parseInt(gameIdInput, 10);
    if (isNaN(id) || id <= 0) {
      setError("Please enter a valid game ID");
      return;
    }

    // Set gameId to trigger useGameGraphQL
    setGameId(id);
  };

  const handleClose = () => {
    setGameIdInput("");
    setGameId(null);
    setError(null);
    onClose();
  };

  return (
    <div className="join-game-modal-overlay" onClick={handleClose}>
      <div className="join-game-modal" onClick={(e) => e.stopPropagation()}>
        <div className="join-game-modal-header">
          <h2 className="join-game-modal-title">JOIN GAME</h2>
          <button className="join-game-modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="join-game-modal-form">
          <div className="join-game-modal-input-group">
            <label htmlFor="gameId" className="join-game-modal-label">
              Game ID
            </label>
            <input
              id="gameId"
              type="number"
              value={gameIdInput}
              onChange={(e) => setGameIdInput(e.target.value)}
              placeholder="Enter game ID"
              className="join-game-modal-input"
              disabled={isLoading}
              min="1"
              required
            />
          </div>

          {error && <p className="join-game-modal-error">{error}</p>}

          <div className="join-game-modal-actions">
            <Button
              type="button"
              onClick={handleClose}
              className="join-game-modal-button join-game-modal-button-cancel"
              variant="default"
              disabled={isLoading}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              className="join-game-modal-button join-game-modal-button-join"
              variant="default"
              disabled={isLoading || !gameIdInput}
            >
              {isLoading ? "CHECKING..." : "JOIN"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
