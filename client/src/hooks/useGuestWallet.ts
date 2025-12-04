import { useCallback } from "react";
import { RpcProvider } from "starknet";
import { useStarknetKit } from "@/context/starknetkit";
import { loadGuestWallet, ensureAccountDeployed } from "@/utils/guestWallet";

/**
 * Hook to handle guest wallet operations including auto-deploy
 */
export function useGuestWallet() {
  const { account, isGuestMode } = useStarknetKit();

  /**
   * Ensure the guest account is deployed before executing a transaction
   * This should be called before any account.execute() call
   */
  const ensureDeployed = useCallback(async () => {
    if (!isGuestMode || !account) {
      // Not a guest wallet, no need to deploy
      return;
    }

    const walletData = loadGuestWallet();
    if (!walletData) {
      throw new Error("Guest wallet data not found");
    }

    // Get the provider from the account
    const provider = new RpcProvider({
      nodeUrl: import.meta.env.VITE_ZN_SEPOLIA_RPC_URL,
    });

    // Ensure the account is deployed
    await ensureAccountDeployed(account, provider, walletData);
  }, [account, isGuestMode]);

  return {
    isGuestMode,
    ensureDeployed,
  };
}
