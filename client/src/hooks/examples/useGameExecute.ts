import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSdk } from "../dojo";
import { setupWorld } from "@/bindings/typescript/contracts.gen";
import { toast } from "sonner";

/**
 * Example hook: Execute a contract transaction
 */
export const useGameExecute = () => {
  const { account } = useAccount();
  const { sdk } = useDojoSdk();
  const [loading, setLoading] = useState(false);

  const executeCreateGame = useCallback(
    async (playerName: string) => {
      if (!sdk || !account) {
        toast.error("Please connect your wallet");
        return;
      }

      setLoading(true);
      try {
        const world = setupWorld(sdk.provider);
        
        const result = await world.game.create(account, playerName);
        
        toast.success("Game created successfully!");
        console.log("Transaction result:", result);
        
        return result;
      } catch (error) {
        console.error("Error executing transaction:", error);
        toast.error("Failed to create game");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [sdk, account]
  );

  const executeJoinGame = useCallback(
    async (gameId: number, playerName: string) => {
      if (!sdk || !account) {
        toast.error("Please connect your wallet");
        return;
      }

      setLoading(true);
      try {
        const world = setupWorld(sdk.provider);
        
        const result = await world.game.join(account, gameId, playerName);
        
        toast.success("Joined game successfully!");
        console.log("Transaction result:", result);
        
        return result;
      } catch (error) {
        console.error("Error executing transaction:", error);
        toast.error("Failed to join game");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [sdk, account]
  );

  return {
    executeCreateGame,
    executeJoinGame,
    loading,
  };
};

