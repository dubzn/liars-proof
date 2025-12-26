import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSdk } from "../dojo";
import { setupWorld } from "@/bindings/typescript/contracts.gen";

/**
 * Example hook: Call a contract (read-only)
 */
export const useGameCall = () => {
  const { account } = useAccount();
  const { sdk } = useDojoSdk();
  const [loading, setLoading] = useState(false);

  const callGame = useCallback(
    async (gameId: number) => {
      if (!sdk || !account) {
        console.error("SDK or account not available");
        return;
      }

      setLoading(true);
      try {
        // Example: Call a read-only function
        // Note: This is a placeholder - adjust based on your contract's callable functions
        const world = setupWorld(sdk.provider);

        // If your contract has a callable read function, use it here
        // const result = await world.game.getGame(gameId);

        console.log("Call executed for game:", gameId);
      } catch (error) {
        console.error("Error calling contract:", error);
      } finally {
        setLoading(false);
      }
    },
    [sdk, account],
  );

  return {
    callGame,
    loading,
  };
};
