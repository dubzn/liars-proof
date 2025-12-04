import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { AccountInterface } from "starknet";
import { ec, RpcProvider, constants } from "starknet";
import {
  type CreateSessionParams,
  type SessionKey,
  createSessionRequest,
  createSession,
  buildSessionAccount,
  bytesToHexString,
} from "@argent/x-sessions";
import { parseUnits } from "viem";
import { useStarknetKit } from "./starknetkit";
import { toast } from "sonner";

// Type for session account
type SessionAccount = AccountInterface;

const ETH_TOKEN_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"; // Standard ETH on Starknet
const GAME_CONTRACT_ADDRESS = import.meta.env.VITE_ZN_GAME_CONTRACT_ADDRESS || "";
// Use the correct chain ID constant for Sepolia
const CHAIN_ID = "0x534e5f5345504f4c4941" as const; // SN_SEPOLIA

interface SessionKeysContextType {
  sessionAccount: SessionAccount | null;
  isSessionActive: boolean;
  createGameSession: (
    account: AccountInterface,
    gameContractAddress: string,
    chainId: "0x534e5f5345504f4c4941"
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
  const { account, provider } = useStarknetKit();
  const [sessionAccount, setSessionAccount] = useState<SessionAccount | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const createGameSession = useCallback(
    async (account: AccountInterface, gameContractAddress: string, chainId: "0x534e5f5345504f4c4941") => {
      try {
        setSessionError(null);
        console.log("[SessionKeys] Creating new game session...");

        // Generate session key pair (same as PonziLand)
        const privateKey = ec.starkCurve.utils.randomPrivateKey();
        const sessionKey: SessionKey = {
          privateKey: bytesToHexString(privateKey),
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
          expiry: BigInt(Math.floor((Date.now() + 1000 * 60 * 60 * 24) / 1000)),
          sessionKey,
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

        // Step 1: Create session request (typed data for user to sign)
        const sessionRequest = createSessionRequest({
          sessionParams,
          chainId,
        });

        console.log("[SessionKeys] Session request created, requesting user signature...");

        // Step 2: Request user signature via wallet
        // Use starknet.js signMessage with the typed data
        const authorisationSignature = await (account as any).signMessage(sessionRequest.sessionTypedData);

        console.log("[SessionKeys] User signature received:", authorisationSignature);

        // Step 3: Create session with authorization
        const session = await createSession({
          sessionRequest,
          address: account.address,
          chainId,
          authorisationSignature,
        });

        console.log("[SessionKeys] Session created:", session);

        // Step 4: Build session account
        console.log("[SessionKeys] Using provider from context:");
        console.log("[SessionKeys] - provider:", provider);
        console.log("[SessionKeys] - provider nodeUrl:", provider?.channel?.nodeUrl);

        if (!provider) {
          throw new Error("Provider is not available from StarknetKit context");
        }

        console.log("[SessionKeys] Building session account with:");
        console.log("[SessionKeys] - session:", JSON.stringify(session, null, 2));
        console.log("[SessionKeys] - sessionKey:", sessionKey);
        console.log("[SessionKeys] - account address:", account.address);
        console.log("[SessionKeys] - chainId:", chainId);

        // Build session account (same approach as PonziLand)
        console.log("[SessionKeys] Building session account...");
        console.log("[SessionKeys] - Session address:", (session as any).address);
        console.log("[SessionKeys] - Account address:", account.address);
        console.log("[SessionKeys] - Provider nodeUrl:", provider.channel.nodeUrl);
        console.log("[SessionKeys] - Chain ID:", chainId);

        // Create a fresh RpcProvider with explicit chainId like PonziLand does
        // Use constants.StarknetChainId.SN_SEPOLIA since Ztarknet uses same chain ID
        const sessionProvider = new RpcProvider({
          nodeUrl: provider.channel.nodeUrl,
          chainId: constants.StarknetChainId.SN_SEPOLIA,
        });

        console.log("[SessionKeys] Created session provider");
        console.log("[SessionKeys] - nodeUrl:", provider.channel.nodeUrl);
        console.log("[SessionKeys] - chainId (string):", chainId);
        console.log("[SessionKeys] - chainId (constant):", constants.StarknetChainId.SN_SEPOLIA);

        const newSessionAccount = await buildSessionAccount({
          useCacheAuthorisation: false, // Same as PonziLand
          session,
          sessionKey,
          provider: sessionProvider,
        });

        console.log("[SessionKeys] Session account created successfully!");
        console.log("[SessionKeys] Session account address:", newSessionAccount.address);

        // Store the session data for potential future use
        const sessionData = {
          session: session as any,
          sessionKey,
          expiresAt: sessionParams.expiry,
        };

        console.log("[SessionKeys] Session data:", sessionData);

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
    [provider]
  );

  const revokeSession = useCallback(() => {
    console.log("[SessionKeys] Revoking session...");
    setSessionAccount(null);
    setIsSessionActive(false);
    localStorage.removeItem("liars_proof_session_key");
    console.log("[SessionKeys] Session revoked");
  }, []);

  // Reset session error when account changes
  useEffect(() => {
    if (account) {
      console.log("[SessionKeys] Account changed, resetting session error");
      setSessionError(null);
    }
  }, [account?.address]);

  // Session keys DISABLED - buildSessionAccount from @argent/x-sessions v8.0.1 has a bug
  // Error: "Cannot read properties of undefined (reading 'toLowerCase')" at Account constructor
  // This happens because buildSessionAccount doesn't properly pass the provider configuration
  // The game works perfectly without session keys, just requires manual transaction approval
  useEffect(() => {
    console.log("[SessionKeys] ⚠️ Session keys are DISABLED");
    console.log("[SessionKeys] Reason: @argent/x-sessions v8.0.1 buildSessionAccount bug with Ztarknet");
    console.log("[SessionKeys] Game will require manual transaction approval");

    // DISABLED - DO NOT ENABLE until @argent/x-sessions is fixed or updated
    // The error persists even with correct RPC URL, chainId, and provider configuration
  }, [account]);

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
