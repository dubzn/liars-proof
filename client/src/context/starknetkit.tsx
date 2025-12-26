import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AccountInterface } from "starknet";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { RpcProvider } from "starknet";
import { setupGuestWallet, loadGuestWallet, hasGuestWallet } from "@/utils/guestWallet";

interface StarknetKitContextType {
  account: AccountInterface | null;
  isConnecting: boolean;
  isGuestMode: boolean;
  isCartridgeMode: boolean;
  connectWithCartridge: () => Promise<void>;
  connectAsGuest: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const StarknetKitContext = createContext<StarknetKitContextType | undefined>(undefined);

export function useStarknetKit() {
  const context = useContext(StarknetKitContext);
  if (!context) {
    throw new Error("useStarknetKit must be used within StarknetKitProvider");
  }
  return context;
}

interface StarknetKitProviderProps {
  children: ReactNode;
}

export function StarknetKitProvider({ children }: StarknetKitProviderProps) {
  const { account: starknetAccount, status, isConnected } = useAccount();
  const { connect: connectStarknet, connectors } = useConnect();
  const { disconnect: disconnectStarknet } = useDisconnect();
  
  const [guestAccount, setGuestAccount] = useState<AccountInterface | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Determine which account to use
  const account = isGuestMode ? guestAccount : (starknetAccount as AccountInterface | null);
  const isCartridgeMode = Boolean(isConnected && !isGuestMode);

  // Try to restore guest wallet on mount
  useEffect(() => {
    const restoreGuestWallet = async () => {
      if (hasGuestWallet() && !isGuestMode && !isConnected) {
        try {
          console.log("[StarknetKit] Restoring guest wallet...");
          const provider = new RpcProvider({
            nodeUrl: import.meta.env.VITE_ZN_SEPOLIA_RPC_URL,
          });
          const walletData = loadGuestWallet();
          if (walletData) {
            const { account: guestAccount } = await setupGuestWallet(provider);
            setGuestAccount(guestAccount);
            setIsGuestMode(true);
            console.log("[StarknetKit] Guest wallet restored");
          }
        } catch (error) {
          console.log("[StarknetKit] No guest wallet to restore:", error);
        }
      }
    };

    restoreGuestWallet();
  }, []);

  const connectWithCartridge = async () => {
    setIsConnecting(true);
    try {
      console.log("[StarknetKit] Connecting with Cartridge Controller...");
      
      if (connectors.length === 0) {
        throw new Error("No connectors available");
      }

      // Use the first connector (ControllerConnector)
      await connectStarknet({ connector: connectors[0] });
      
      setIsGuestMode(false);
      console.log("[StarknetKit] Cartridge Controller connected");
    } catch (error) {
      console.error("[StarknetKit] Error connecting with Cartridge:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const connectAsGuest = async () => {
    setIsConnecting(true);
    try {
      console.log("[StarknetKit] Connecting as guest...");

      const provider = new RpcProvider({
        nodeUrl: import.meta.env.VITE_ZN_SEPOLIA_RPC_URL,
      });

      const { account: guestAccount, walletData } = await setupGuestWallet(provider);

      setGuestAccount(guestAccount);
      setIsGuestMode(true);
      console.log("[StarknetKit] Guest account connected:", walletData.address);
    } catch (error) {
      console.error("[StarknetKit] Error connecting as guest:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      console.log("[StarknetKit] Disconnecting...");

      if (isGuestMode) {
        // For guest mode, just clear the state but keep wallet in localStorage
        setIsGuestMode(false);
        setGuestAccount(null);
      } else {
        // For Cartridge Controller, use starknet-react's disconnect
        await disconnectStarknet();
      }

      console.log("[StarknetKit] Disconnected");
    } catch (error) {
      console.error("[StarknetKit] Error disconnecting:", error);
    }
  };

  // Update isConnecting based on status
  useEffect(() => {
    setIsConnecting(status === 'connecting' || status === 'reconnecting');
  }, [status]);

  return (
    <StarknetKitContext.Provider
      value={{
        account,
        isConnecting,
        isGuestMode,
        isCartridgeMode,
        connectWithCartridge,
        connectAsGuest,
        disconnect,
      }}
    >
      {children}
    </StarknetKitContext.Provider>
  );
}
