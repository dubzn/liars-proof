import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useStarknetKit } from "@/context/starknetkit";
import { useGuestWallet } from "@/hooks/useGuestWallet";
import { byteArray, num } from "starknet";
import { toast } from "sonner";
import { CharacterCarousel } from "@/components/login/CharacterCarousel";
import { JoinGameModal } from "@/components/login/JoinGameModal";
import { ProcessingModal } from "@/components/login/ProcessingModal";
import { VolumeControl } from "@/components/audio/VolumeControl";
import { useParallax } from "@/hooks/useParallax";
import "./Login.css";

const GAME_CONTRACT_ADDRESS = import.meta.env.VITE_ZN_GAME_CONTRACT_ADDRESS || "";
const DEFAULT_PLAYER_NAME = "";
const PLAYER_NAME_STORAGE_KEY = "liars_proof_player_name";

export const Login = () => {
  const { account, connector, isConnecting, isAvailable, isGuestMode, connect, connectAsGuest, disconnect } = useStarknetKit();
  const { ensureDeployed } = useGuestWallet();
  const navigate = useNavigate();
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [playerName, setPlayerName] = useState<string>(DEFAULT_PLAYER_NAME);
  const [processingStatus, setProcessingStatus] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const backgroundParallax = useParallax(15); // Subtle parallax effect for background
  const isCreatingGameRef = useRef(false); // Ref to track creation state synchronously
  const isJoiningGameRef = useRef(false); // Ref to track join state synchronously
  const audioRef = useRef<HTMLAudioElement | null>(null); // Ref for background music

  // Load player name from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem(PLAYER_NAME_STORAGE_KEY);
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  // Save player name to localStorage when it changes
  useEffect(() => {
    if (playerName && playerName !== DEFAULT_PLAYER_NAME) {
      localStorage.setItem(PLAYER_NAME_STORAGE_KEY, playerName);
    }
  }, [playerName]);

  // Initialize background music (will start after user interaction)
  useEffect(() => {
    const audio = new Audio("/sounds/login.mp3");
    audio.loop = true;
    
    audio.volume = 0; // Start at 0 for fade in
    audioRef.current = audio;

    // Function to start audio with fade in
    const startAudio = () => {
      if (!audioRef.current) return;
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Fade in over 2 seconds to target volume
            // Check for saved volume changes during fade-in
            let fadeInInterval: NodeJS.Timeout | null = null;
            fadeInInterval = setInterval(() => {
              if (!audioRef.current) {
                if (fadeInInterval) clearInterval(fadeInInterval);
                return;
              }
              
              // Check if volume was changed externally (by VolumeControl)
              const currentSavedVolume = localStorage.getItem("liars_proof_volume");
              const currentTargetVolume = currentSavedVolume ? parseFloat(currentSavedVolume) : 0.15;
              
              // If volume is already at or above target, stop fading
              if (audioRef.current.volume >= currentTargetVolume) {
                if (fadeInInterval) clearInterval(fadeInInterval);
                return;
              }
              
              // Continue fading to current target volume
              audioRef.current.volume = Math.min(audioRef.current.volume + 0.05, currentTargetVolume);
            }, 100);
          })
          .catch(() => {
            // Silently handle play errors
          });
      }
    };

    // Try to start audio on first user interaction
    const handleFirstInteraction = () => {
      startAudio();
      // Remove listeners after first interaction
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };

    // Listen for first user interaction
    document.addEventListener("click", handleFirstInteraction, { once: true });
    document.addEventListener("keydown", handleFirstInteraction, { once: true });
    document.addEventListener("touchstart", handleFirstInteraction, { once: true });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, []);

  // Fade out music before navigation
  const fadeOutAndNavigate = async (path: string) => {
    if (!audioRef.current) {
      navigate(path);
      return;
    }

    const audio = audioRef.current;

    // Fade out over 1 second
    const fadeOutInterval = setInterval(() => {
      if (audio.volume > 0) {
        audio.volume = Math.max(audio.volume - 0.1, 0);
      } else {
        clearInterval(fadeOutInterval);
        audio.pause();
        audio.src = "";
        navigate(path);
      }
    }, 100);
  };

  const createGame = async () => {
    // Double check: prevent multiple simultaneous executions using ref for synchronous check
    if (!account || isCreatingGame || isCreatingGameRef.current) {
      console.log("[Login] ⚠️ Cannot create game: account missing or already creating");
      return;
    }

    // Set both state and ref to prevent race conditions
    isCreatingGameRef.current = true;
    setIsCreatingGame(true);
    try {
      console.log("[Login] Creating game with contract:", GAME_CONTRACT_ADDRESS);

      // If guest mode, ensure account is deployed first
      if (isGuestMode) {
        setProcessingStatus({
          title: "DEPLOYING ACCOUNT",
          message: "Deploying your guest account...",
        });
        await ensureDeployed();
      }

      // Convert playerName to ByteArray
      // If empty, use "ZStarknet" as fallback
      const nameToUse = playerName.trim() || "ZStarknet";

      // Show processing modal - preparing transaction
      setProcessingStatus({
        title: "CREATING GAME",
        message: "Please sign the transaction in your wallet",
      });

      // Convert string to ByteArray using byteArrayFromString
      // Reference: https://starknetjs.com/docs/API/namespaces/byteArray/#bytearrayfromstring
      const byteArrayData = byteArray.byteArrayFromString(nameToUse);

      console.log("[Login] Player name:", nameToUse);
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

      // Update modal - waiting for signature
      setProcessingStatus({
        title: "CREATING GAME",
        message: "Please sign the transaction in your wallet",
      });

      // Execute the create function
      const result = await account.execute({
        contractAddress: GAME_CONTRACT_ADDRESS,
        entrypoint: "create",
        calldata: serializedByteArray,
      });
      console.log("[Login] Transaction hash:", result.transaction_hash);
      
      // Update modal - waiting for confirmation
      setProcessingStatus({
        title: "CREATING GAME",
        message: "Transaction submitted, waiting for confirmation.....",
      });

      // Wait for transaction to be accepted
      const receipt = await account.waitForTransaction(result.transaction_hash, {
        retryInterval: 100,
        successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
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
                  setProcessingStatus(null); // Close modal
                  toast.success(`Game created! ID: ${gameId}`);
                  fadeOutAndNavigate(`/game/${gameId}`);
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
      console.log("[Login] Could not extract game_id from events, checking transaction...");
      setProcessingStatus(null); // Close modal
      toast.success("Game creation transaction submitted!");
      
      
    } catch (error) {
      console.error("[Login] Error creating game:", error);
      setProcessingStatus(null); // Close modal on error
      toast.error(`Failed to create game: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Reset both state and ref
      isCreatingGameRef.current = false;
      setIsCreatingGame(false);
    }
  };

  const handleConnect = async () => {
    if (!account && !isConnecting) {
      try {
        console.log("[Login] Connecting wallet...");
        await connect();
      } catch (error) {
        console.error("[Login] Error connecting wallet:", error);
        toast.error("Failed to connect wallet");
      }
    }
  };

  const handleConnectAsGuest = async () => {
    if (!account && !isConnecting) {
      try {
        console.log("[Login] Connecting as guest...");
        
        // Check if wallet already exists
        const existingWallet = localStorage.getItem("liars_proof_guest_wallet");
        
        if (existingWallet) {
          // Wallet exists, just connect
          setProcessingStatus({
            title: "CONNECTING GUEST WALLET",
            message: "Restoring your guest wallet...",
          });
          await connectAsGuest();
          setProcessingStatus(null);
          toast.success("Guest wallet connected!");
          return;
        }

        // New wallet creation flow with progress updates
        setProcessingStatus({
          title: "CREATING GUEST WALLET (COULD TAKE A MINUTE)",
          message: "Connecting to ZStarknet network...",
        });

        // Start the connection process
        const connectPromise = connectAsGuest();

        // Update progress messages with timeouts
        const progressUpdates = [
          { delay: 4000, message: "Computing wallet address.." },
          { delay: 8000, message: "Requesting funds from faucet.." },
          { delay: 12000, message: "Waiting for funding confirmation.." },
          { delay: 20000, message: "Deploying account contract.." },
          { delay: 24000, message: "Waiting for deployment confirmation.." },
        ];

        const timeouts: NodeJS.Timeout[] = [];
        progressUpdates.forEach(({ delay, message }) => {
          const timeout = setTimeout(() => {
            setProcessingStatus((prev) => {
              if (prev) {
                return {
                  title: prev.title,
                  message: message,
                };
              }
              return prev;
            });
          }, delay);
          timeouts.push(timeout);
        });

        try {
          await connectPromise;
          
          // Clear all timeouts
          timeouts.forEach(clearTimeout);
          
          // Final success message
          setProcessingStatus({
            title: "GUEST WALLET READY",
            message: "Wallet created and funded successfully!",
          });
          
          // Close modal after a brief delay
          setTimeout(() => {
            setProcessingStatus(null);
            toast.success("Guest wallet created successfully!");
          }, 1000);
        } catch (error) {
          // Clear all timeouts on error
          timeouts.forEach(clearTimeout);
          throw error;
        }
      } catch (error) {
        console.error("[Login] Error connecting as guest:", error);
        setProcessingStatus(null);
        toast.error("Failed to create guest wallet. Please try again.");
      }
    }
  };

  const handleCreateGame = async () => {
    // Prevent multiple clicks
    if (isCreatingGame) {
      console.log("[Login] ⚠️ Game creation already in progress, ignoring click");
      return;
    }
    
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    await createGame();
  };

  const handleJoinGame = () => {
    setIsJoinModalOpen(true);
  };

  const handleJoinGameSubmit = async (gameId: number) => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Prevent multiple simultaneous executions
    if (isJoiningGame || isJoiningGameRef.current) {
      console.log("[Login] ⚠️ Already joining a game, ignoring request");
      return;
    }

    // Set both state and ref to prevent race conditions
    isJoiningGameRef.current = true;
    setIsJoiningGame(true);

    try {
      // If guest mode, ensure account is deployed first
      if (isGuestMode) {
        setProcessingStatus({
          title: "DEPLOYING ACCOUNT",
          message: "Deploying your guest account...",
        });
        await ensureDeployed();
      }

      // If empty, use "ZStarknet" as fallback
      const nameToUse = playerName.trim() || "ZStarknet";
      console.log("[Login] Joining game with ID:", gameId, "and name:", nameToUse);

      // Show processing modal - preparing transaction
      setProcessingStatus({
        title: "JOINING GAME",
        message: "Please sign the transaction in your wallet",
      });

      // Convert playerName to ByteArray
      const byteArrayData = byteArray.byteArrayFromString(nameToUse);

      // Serialize ByteArray for calldata
      const serializedByteArray: string[] = [
        num.toHex(byteArrayData.data.length),
        ...byteArrayData.data.map((d) => num.toHex(d)),
        num.toHex(byteArrayData.pending_word),
        num.toHex(byteArrayData.pending_word_len),
      ];

      // Update modal - waiting for signature
      setProcessingStatus({
        title: "JOINING GAME",
        message: "Please sign the transaction in your wallet",
      });

      // Execute the join function
      const result = await account.execute({
        contractAddress: GAME_CONTRACT_ADDRESS,
        entrypoint: "join",
        calldata: [gameId.toString(), ...serializedByteArray],
      });

      console.log("[Login] Transaction hash:", result.transaction_hash);

      // Update modal - waiting for confirmation
      setProcessingStatus({
        title: "JOINING GAME",
        message: "Transaction submitted, waiting for confirmation.....",
      });

      // Wait for transaction to be accepted
      await account.waitForTransaction(result.transaction_hash, {
        retryInterval: 100,
        successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
      });

      console.log("[Login] ✅ Successfully joined game:", gameId);
      setProcessingStatus(null); // Close modal
      toast.success(`Joined game ${gameId} as ${nameToUse}`);
      fadeOutAndNavigate(`/game/${gameId}`);
    } catch (error) {
      console.error("[Login] Error joining game:", error);
      setProcessingStatus(null); // Close modal on error
      toast.error(`Failed to join game: ${error instanceof Error ? error.message : String(error)}`);
      throw error; // Re-throw to let modal handle it
    } finally {
      // Reset both state and ref
      isJoiningGameRef.current = false;
      setIsJoiningGame(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("[Login] Error disconnecting wallet:", error);
      toast.error("Failed to disconnect wallet");
    }
  };

  return (
    <div className="login-container">
      <div 
        className="login-background" 
        style={{
          transform: `translate(${backgroundParallax.x}px, ${backgroundParallax.y}px)`,
        }}
      />
      <div className="login-content-wrapper">
        {/* Connected status and logout button - absolute top left */}
        {account && (
          <div className="login-wallet-status-container">
            
            <span className="login-connected-text" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isGuestMode ? (
                <>
                  GUEST MODE
                </>
              ) : (
                <>
                  {connector?.icon
                    ? typeof connector.icon === "string"
                      ? <img src={connector.icon} alt="" style={{ width: 20, height: 20, objectFit: "contain", marginRight: 6 }} />
                      : typeof connector.icon === "object" && connector.icon.light
                        ? <img src={connector.icon.light} alt="" style={{ width: 20, height: 20, objectFit: "contain", marginRight: 6 }} />
                        : null
                    : null}
                  READY CONNECTED
                </>
              )}
            </span>
            <button
              onClick={handleDisconnect}
              className="login-logout-button"
              title="Disconnect wallet"
            >
              <img src="/images/icons/logout.png" alt="Logout" />
            </button>
          </div>
        )}
        
        {/* Logo - absolute bottom left */}
        <img src="/logo.png" alt="LIARS PROOF" className="login-logo" />
        <div className="login-volume-container">
          <VolumeControl audioRef={audioRef} />
        </div>
        <div className="login-left-panel">
          {account ? (
            <div className="login-connected-section">
              
              <div className="login-buttons-container">
                {/* Player name input - above buttons */}
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="login-player-name-input"
                placeholder="ENTER PLAYER NAME"
                maxLength={50}
              />
                <Button
                  onClick={handleCreateGame}
                  className="login-button"
                  variant="default"
                  disabled={isCreatingGame}
                >
                  {isCreatingGame ? "Creating..." : "CREATE GAME"}
                </Button>
                <Button
                  onClick={handleJoinGame}
                  className="login-button"
                  variant="default"
                >
                  JOIN GAME
                </Button>
              </div>
            </div>
          ) : (
            <div className="login-disconnected-section">
              <Button
                onClick={handleConnect}
                className="login-button"
                variant="default"
                disabled={!isAvailable || isConnecting}
              >
                {isConnecting
                  ? "Connecting..."
                  : !isAvailable
                    ? "Wallet not available"
                    : "CONNECT WALLET"}
              </Button>
              {!isConnecting && (
              <Button
                onClick={handleConnectAsGuest}
                className="login-button"
                variant="default"
                disabled={isConnecting}
                style={{
                  background: "linear-gradient(135deg,rgb(242, 165, 59) 0%, rgb(214, 87, 13) 100%)",
                }}
              >
                PLAY AS GUEST
              </Button>
              )}
              <p className="login-wallet-support-text">
                Guest mode creates a temporary wallet funded automatically<br />
                Only Ready wallet on the ZStarknet network is supported 
              </p>
              {!isAvailable && (
                <p className="login-error-message">
                  Please install Ready or Braavos Wallet
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="login-right-panel">
          <CharacterCarousel />
        </div>
      </div>
      
      {/* Footer */}
      <div className="login-footer">
        <p className="login-footer-text">
          Submission for Zypherpunk Hackathon by @dub_zn and @dpinoness
        </p>
      </div>

      {/* Join Game Modal */}
      <JoinGameModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={handleJoinGameSubmit}
      />

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={processingStatus !== null}
        title={processingStatus?.title || ""}
        message={processingStatus?.message || ""}
      />
    </div>
  );
};

