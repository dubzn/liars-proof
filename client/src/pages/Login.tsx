import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useStarknetKit } from "@/context/starknetkit";
import { byteArray, num } from "starknet";
import { getSelectorFromTag } from "@dojoengine/utils";
import { toast } from "sonner";
import "./Login.css";

const GAME_CONTRACT_ADDRESS = "0x034388d18757792524581397d4304c89404e0c2615fe31451927f37ee040abe4";

export const Login = () => {
  const { account, isConnecting, isAvailable, connect } = useStarknetKit();
  const navigate = useNavigate();
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  // Create game and redirect when wallet is connected
  useEffect(() => {
    if (account && !isCreatingGame) {
      createGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const createGame = async () => {
    if (!account) return;

    setIsCreatingGame(true);
    try {
      console.log("[Login] Creating game with contract:", GAME_CONTRACT_ADDRESS);
      
      // Convert playerName to ByteArray (using "front" as requested, or empty string)
      const playerName = "front"; // or "" for empty
      
      // Convert string to ByteArray using byteArrayFromString
      // Reference: https://starknetjs.com/docs/API/namespaces/byteArray/#bytearrayfromstring
      const byteArrayData = byteArray.byteArrayFromString(playerName);
      
      console.log("[Login] Player name:", playerName);
      console.log("[Login] ByteArray data:", byteArrayData);
      
      // Serialize ByteArray for calldata manually
      // ByteArray format: [data_length, ...data, pending_word, pending_word_len]
      // Convert all values to strings (hex format) as expected by calldata
      const serializedByteArray: string[] = [
        num.toHex(byteArrayData.data.length),
        ...byteArrayData.data.map((d) => num.toHex(d)),
        num.toHex(byteArrayData.pending_word),
        num.toHex(byteArrayData.pending_word_len),
      ];
      
      // Execute the create function
      const result = await account.execute({
        contractAddress: GAME_CONTRACT_ADDRESS,
        entrypoint: "create",
        calldata: serializedByteArray,
      });
      console.log("[Login] Transaction hash:", result.transaction_hash);

      // Wait for transaction to be accepted
      const receipt = await account.waitForTransaction(result.transaction_hash, {
        retryInterval: 100,
        successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1", "PRE_CONFIRMED"],
      });

      console.log("[Login] Transaction receipt:", receipt);

      const gameCreatedEventHash = "0x1a2f334228cee715f1f0f54053bb6b5eac54fa336e0bc1aacf7516decb0471d";

      const receiptWithEvents = receipt as any;
      if (receiptWithEvents.events && Array.isArray(receiptWithEvents.events) && receiptWithEvents.events.length > 0) {
        for (let i = 0; i < receiptWithEvents.events.length; i++) {
          const event = receiptWithEvents.events[i];
          
          // Check if this event has the GameCreated hash in its keys
          // The event hash is usually in keys[0] or could be in any key position
          if (event.keys && Array.isArray(event.keys)) {
            const hasGameCreatedHash = event.keys.some((key: string) => 
              key.toLowerCase() === gameCreatedEventHash.toLowerCase()
            );
            
            if (hasGameCreatedHash) {
              console.log("[Login] ✅ Found GameCreated event!");
              console.log("[Login] Event #", i, ":", {
                from_address: event.from_address,
                keys: event.keys,
                data: event.data,
                keys_length: event.keys.length,
                data_length: event.data?.length,
              });
              
              // Extract game_id from data[3] as specified by user
              if (event.data && event.data.length > 3) {
                const gameId = Number(num.toBigInt(event.data[3]));
                
                if (gameId > 0) {
                  console.log("[Login] 🎮 Game created! Game ID:", gameId);
                  toast.success(`Game created! ID: ${gameId}`);
                  navigate(`/game/${gameId}`);
                  return;
                } else {
                  console.log("[Login] ⚠️ Invalid game_id extracted from data[3]:", gameId);
                }
              } else {
                console.log("[Login] ⚠️ Event data doesn't have enough elements (need at least 4, got:", event.data?.length, ")");
              }
            }
          }
        }
        
        console.log("[Login] ⚠️ GameCreated event not found in receipt events");
      }

      // If we can't find it in events, try calling the contract to get the latest game
      // For now, let's show a message and redirect to a default game
      console.log("[Login] Could not extract game_id from events, checking transaction...");
      toast.success("Game creation transaction submitted!");
      
      // As a fallback, we could query the contract or wait a bit and try to get the game_id
      // For now, let's redirect to game/1 as a placeholder
      // In production, you'd want to query the contract or use the event data properly
      navigate("/game/1");
      
    } catch (error) {
      console.error("[Login] Error creating game:", error);
      toast.error(`Failed to create game: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleConnect = async () => {
    if (!account && !isConnecting) {
      try {
        console.log("[Login] Connecting wallet...");
        await connect();
        // Navigation will happen automatically via useEffect when account changes
      } catch (error) {
        console.error("[Login] Error connecting wallet:", error);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Liar's Proof</h1>
        <div className="login-content">
          {account ? (
            <div className="login-connected-section">
              <div className="login-address-container">
                <p className="login-address-label">Connected Address:</p>
                <p className="login-address">{account.address}</p>
              </div>
              <p className="login-redirect-message">
                {isCreatingGame ? "Creating game..." : "Redirecting to game..."}
              </p>
            </div>
          ) : (
            <>
              <Button
                onClick={handleConnect}
                className="login-button-full"
                variant="default"
                disabled={!isAvailable || isConnecting}
              >
                {isConnecting
                  ? "Connecting..."
                  : !isAvailable
                    ? "Wallet not available"
                    : "Connect Wallet (Argent/Ready)"}
              </Button>
              {!isAvailable && (
                <p className="login-error-message">
                  Please install Argent X or Ready Wallet
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

