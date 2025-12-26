import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AccountInterface } from "starknet";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";

interface StarknetKitContextType {
  account: AccountInterface | null;
  isConnecting: boolean;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const StarknetKitContext = createContext<StarknetKitContextType | undefined>(
  undefined,
);

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
  const { account, status, isConnected } = useAccount();
  const { connect: connectStarknet, connectors } = useConnect();
  const { disconnect: disconnectStarknet } = useDisconnect();

  const [isConnecting, setIsConnecting] = useState(false);

  const connect = async () => {
    setIsConnecting(true);
    try {
      if (connectors.length === 0) {
        throw new Error("No connectors available");
      }

      await connectStarknet({ connector: connectors[0] });
    } catch (error) {
      console.error("[StarknetKit] Error connecting:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await disconnectStarknet();
    } catch (error) {
      console.error("[StarknetKit] Error disconnecting:", error);
    }
  };

  useEffect(() => {
    setIsConnecting(status === "connecting" || status === "reconnecting");
  }, [status]);

  return (
    <StarknetKitContext.Provider
      value={{
        account: account as AccountInterface | null,
        isConnecting,
        isConnected: Boolean(isConnected),
        connect,
        disconnect,
      }}
    >
      {children}
    </StarknetKitContext.Provider>
  );
}
