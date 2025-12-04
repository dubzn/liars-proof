import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { AccountInterface } from "starknet";
import { ec, RpcProvider } from "starknet";
import {
  type CreateSessionParams,
  createSession,
  buildSessionAccount,
  type SessionAccount,
} from "@argent/x-sessions";
import { parseUnits } from "viem";
import { useStarknetKit } from "./starknetkit";
import { toast } from "sonner";

const ARGENT_SESSION_SERVICE_BASE_URL = "https://cloud.argent-api.com/v1";
const ETH_TOKEN_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
const GAME_CONTRACT_ADDRESS = import.meta.env.VITE_ZN_GAME_CONTRACT_ADDRESS || "";
const CHAIN_ID = import.meta.env.VITE_CHAIN_ID || "SN_SEPOLIA";

interface SessionKeyData {
  privateKey: string;
  publicKey: string;
}

interface SessionKeysContextType {
  sessionAccount: SessionAccount | null;
  isSessionActive: boolean;
  createGameSession: (
    account: AccountInterface,
    gameContractAddress: string,
    chainId: string
  ) => Promise<void>;
  revokeSession: () => void;
  sessionError: string | null;
}

const SessionKeysContext = createContext<SessionKeysContextType | undefined>(undefined);

export function useSessionKeys() {
  const context = useContext(SessionKeysContext);
  if (!context) {
    throw new Error("useSessionKeys must be used within SessionKeysProvider");
  }
  return context;
}

interface SessionKeysProviderProps {
  children: ReactNode;
}

export function SessionKeysProvider({ children }: SessionKeysProviderProps) {
  const { account } = useStarknetKit();
  const [sessionAccount, setSessionAccount] = useState<SessionAccount | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const createGameSession = useCallback(
    async (account: AccountInterface, gameContractAddress: string, chainId: string) => {
      try {
        setSessionError(null);
        console.log("[SessionKeys] Creating new game session...");

        // Generate session key pair
        const privateKey = ec.starkCurve.utils.randomPrivateKey();
        const sessionKey: SessionKeyData = {
          privateKey: `0x${Buffer.from(privateKey).toString("hex")}`,
          publicKey: ec.starkCurve.getStarkKey(privateKey),
        };

        console.log("[SessionKeys] Session key generated:", sessionKey.publicKey);

        // Define session parameters for game actions
        const sessionParams: CreateSessionParams = {
          allowedMethods: [
            {
              "Contract Address": gameContractAddress,
              selector: "create",
            },
            {
              "Contract Address": gameContractAddress,
              selector: "join",
            },
            {
              "Contract Address": gameContractAddress,
              selector: "submit_hand_commitment",
            },
            {
              "Contract Address": gameContractAddress,
              selector: "submit_condition_choice",
            },
            {
              "Contract Address": gameContractAddress,
              selector: "submit_challenge_choice",
            },
            {
              "Contract Address": gameContractAddress,
              selector: "submit_round_proof",
            },
          ],
          // Session expires in 24 hours
          expiry: Math.floor((Date.now() + 1000 * 60 * 60 * 24) / 1000),
          publicKey: sessionKey.publicKey,
          metaData: {
            projectID: "liars-proof-game",
            txFees: [
              {
                tokenAddress: ETH_TOKEN_ADDRESS,
                maxAmount: parseUnits("0.1", 18).toString(), // Max 0.1 ETH for gas
              },
            ],
          },
        };

        console.log("[SessionKeys] Session params:", sessionParams);

        // Create session request typed data
        const sessionRequest = await createSession({
          ...sessionParams,
          account,
        });

        console.log("[SessionKeys] Session request created, requesting user signature...");

        // Request user signature via wallet
        // @ts-expect-error - wallet_signTypedData is supported by Ready wallet
        const signature = await account.signMessage(sessionRequest.sessionMessageHash);

        console.log("[SessionKeys] User signature received");

        // Build session account
        const provider = new RpcProvider({
          nodeUrl: import.meta.env.VITE_ZN_SEPOLIA_RPC_URL,
        });

        const newSessionAccount = await buildSessionAccount({
          useCacheAuthorisation: true,
          accountSessionSignature: signature,
          sessionParams,
          provider,
          argentSessionServiceBaseUrl: ARGENT_SESSION_SERVICE_BASE_URL,
          chainId,
        });

        console.log("[SessionKeys] Session account created successfully");
        console.log("[SessionKeys] newSessionAccount:", newSessionAccount);
        console.log("[SessionKeys] newSessionAccount address:", newSessionAccount?.address);
        console.log("[SessionKeys] newSessionAccount type:", typeof newSessionAccount);

        // Store session data
        setSessionAccount(newSessionAccount);
        setIsSessionActive(true);

        // Store session key in localStorage for persistence
        localStorage.setItem(
          "liars_proof_session_key",
          JSON.stringify({
            privateKey: sessionKey.privateKey,
            publicKey: sessionKey.publicKey,
            expiry: sessionParams.expiry,
          })
        );

        console.log("[SessionKeys] ✅ Session activated successfully");
        console.log("[SessionKeys] State updated - isSessionActive:", true);
        console.log("[SessionKeys] State updated - sessionAccount:", newSessionAccount);
      } catch (error) {
        console.error("[SessionKeys] Error creating session:", error);
        setSessionError(error instanceof Error ? error.message : "Failed to create session");
        setIsSessionActive(false);
      }
    },
    []
  );

  const revokeSession = useCallback(() => {
    console.log("[SessionKeys] Revoking session...");
    setSessionAccount(null);
    setIsSessionActive(false);
    localStorage.removeItem("liars_proof_session_key");
    console.log("[SessionKeys] Session revoked");
  }, []);

  // Automatically create session when wallet connects
  useEffect(() => {
    console.log("[SessionKeys] useEffect triggered");
    console.log("[SessionKeys] account:", account?.address);
    console.log("[SessionKeys] isSessionActive:", isSessionActive);
    console.log("[SessionKeys] sessionError:", sessionError);
    console.log("[SessionKeys] GAME_CONTRACT_ADDRESS:", GAME_CONTRACT_ADDRESS);
    console.log("[SessionKeys] CHAIN_ID:", CHAIN_ID);

    const initializeSession = async () => {
      if (account && !isSessionActive && !sessionError) {
        try {
          console.log("[SessionKeys] 🔑 Wallet connected, creating session...");
          console.log("[SessionKeys] About to call createGameSession...");
          await createGameSession(account, GAME_CONTRACT_ADDRESS, CHAIN_ID);
          console.log("[SessionKeys] createGameSession completed");
          toast.success("Session activated! You can now play without signing every transaction.");
        } catch (error) {
          console.error("[SessionKeys] ❌ Failed to create session:", error);
          console.error("[SessionKeys] Error details:", error);
          // Don't show error toast - session is optional
          console.log("[SessionKeys] ⚠️ Continuing without session keys");
        }
      } else {
        console.log("[SessionKeys] Skipping session creation:", {
          hasAccount: !!account,
          isSessionActive,
          hasError: !!sessionError,
        });
      }
    };

    initializeSession();
  }, [account, isSessionActive, sessionError, createGameSession]);

  return (
    <SessionKeysContext.Provider
      value={{
        sessionAccount,
        isSessionActive,
        createGameSession,
        revokeSession,
        sessionError,
      }}
    >
      {children}
    </SessionKeysContext.Provider>
  );
}
