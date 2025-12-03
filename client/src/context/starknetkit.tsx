import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AccountInterface } from "starknet";
import { InjectedConnector } from "starknetkit/injected";
import { RpcProvider } from "starknet";

interface StarknetKitContextType {
  account: AccountInterface | null;
  connector: InjectedConnector | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isAvailable: boolean;
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
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [connector, setConnector] = useState<InjectedConnector | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  // Initialize connector for Argent/Ready
  useEffect(() => {
    const initConnector = async () => {
      try {
        const argentConnector = new InjectedConnector({
          options: {
            id: "argentX",
            name: "Ready Wallet (formerly Argent)",
          },
        });

        const available = argentConnector.available();
        setIsAvailable(available);
        setConnector(argentConnector);

        // Try to restore connection if available
        if (available) {
          try {
            const provider = new RpcProvider({
              nodeUrl: import.meta.env.VITE_ZN_SEPOLIA_RPC_URL,
            });
            const ready = await argentConnector.ready();
            if (ready) {
              const connectedAccount = await argentConnector.account(provider);
              if (connectedAccount) {
                setAccount(connectedAccount);
              }
            }
          } catch (error) {
            console.log("[StarknetKit] No existing connection:", error);
          }
        }
      } catch (error) {
        console.error("[StarknetKit] Error initializing connector:", error);
      }
    };

    initConnector();
  }, []);

  const connect = async () => {
    if (!connector || !isAvailable) {
      console.error("[StarknetKit] Connector not available");
      return;
    }

    setIsConnecting(true);
    try {
      console.log("[StarknetKit] Connecting...");
      const connectorData = await connector.connect({
        silent_mode: false,
      });

      console.log("[StarknetKit] Connected:", connectorData);

      // Get the account using the provider
      const provider = new RpcProvider({
        nodeUrl: import.meta.env.VITE_ZN_SEPOLIA_RPC_URL,
      });

      const connectedAccount = await connector.account(provider);
      setAccount(connectedAccount);
      console.log("[StarknetKit] Account set:", connectedAccount.address);
    } catch (error) {
      console.error("[StarknetKit] Error connecting:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!connector) return;

    try {
      console.log("[StarknetKit] Disconnecting...");
      await connector.disconnect();
      setAccount(null);
      console.log("[StarknetKit] Disconnected");
    } catch (error) {
      console.error("[StarknetKit] Error disconnecting:", error);
    }
  };

  return (
    <StarknetKitContext.Provider
      value={{
        account,
        connector,
        isConnecting,
        connect,
        disconnect,
        isAvailable,
      }}
    >
      {children}
    </StarknetKitContext.Provider>
  );
}

