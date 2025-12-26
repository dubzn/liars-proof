import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useStarknetKit } from "@/context/starknetkit";
import { byteArray, num } from "starknet";
import { toast } from "sonner";
import { lookupAddresses } from "@cartridge/controller";
import { CharacterCarousel } from "@/components/login/CharacterCarousel";
import { JoinGameModal } from "@/components/login/JoinGameModal";
import { ProcessingModal } from "@/components/login/ProcessingModal";
import { VolumeControl } from "@/components/audio/VolumeControl";
import { useParallax } from "@/hooks/useParallax";
import "./Login.css";

const GAME_CONTRACT_ADDRESS =
  import.meta.env.VITE_ZN_GAME_CONTRACT_ADDRESS || "";

export const Login = () => {
  const { account, isConnecting, isConnected, connect, disconnect } =
    useStarknetKit();
  const navigate = useNavigate();
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoadingUsername, setIsLoadingUsername] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const backgroundParallax = useParallax(15); // Subtle parallax effect for background
  const isCreatingGameRef = useRef(false); // Ref to track creation state synchronously
  const isJoiningGameRef = useRef(false); // Ref to track join state synchronously
  const audioRef = useRef<HTMLAudioElement | null>(null); // Ref for background music

  // Fetch username from Controller when account is connected
  useEffect(() => {
    const fetchUsername = async () => {
      if (!account || !isConnected) {
        setUsername(null);
        return;
      }

      setIsLoadingUsername(true);
      try {
        const addressMap = await lookupAddresses([account.address]);
        const fetchedUsername = addressMap.get(account.address);
        
        if (fetchedUsername) {
          console.log("[Login] Username from Controller:", fetchedUsername);
          setUsername(fetchedUsername);
        } else {
          console.log("[Login] No username found for address:", account.address);
          setUsername(null);
        }
      } catch (error) {
        console.error("[Login] Error fetching username:", error);
        setUsername(null);
      } finally {
        setIsLoadingUsername(false);
      }
    };

    fetchUsername();
  }, [account, isConnected]);

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
              const currentSavedVolume =
                localStorage.getItem("liars_proof_volume");
              const currentTargetVolume = currentSavedVolume
                ? parseFloat(currentSavedVolume)
                : 0.15;

              // If volume is already at or above target, stop fading
              if (audioRef.current.volume >= currentTargetVolume) {
                if (fadeInInterval) clearInterval(fadeInInterval);
                return;
              }

              // Continue fading to current target volume
              audioRef.current.volume = Math.min(
                audioRef.current.volume + 0.05,
                currentTargetVolume,
              );
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
    document.addEventListener("keydown", handleFirstInteraction, {
      once: true,
    });
    document.addEventListener("touchstart", handleFirstInteraction, {
      once: true,
    });

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
      console.log(
        "[Login] ⚠️ Cannot create game: account missing or already creating",
      );
      return;
    }

    // Set both state and ref to prevent race conditions
    isCreatingGameRef.current = true;
    setIsCreatingGame(true);
    try {
      console.log(
        "[Login] Creating game with contract:",
        GAME_CONTRACT_ADDRESS,
      );

      // Use username from Controller, fallback to "ZStarknet" if not available
      const nameToUse = username || "ZStarknet";

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
        message: "Submitting transaction ...",
      });

      // Execute the create function
      const result = await account.execute({
        contractAddress: GAME_CONTRACT_ADDRESS,
        entrypoint: "create",
        calldata: serializedByteArray,
      });

      console.log("[Login] Transaction hash:", result.transaction_hash);

      // Wait for transaction to be accepted
      const receipt = await account.waitForTransaction(
        result.transaction_hash,
        {
          retryInterval: 100,
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
        },
      );

      console.log("[Login] Transaction receipt:", receipt);

      const gameCreatedEventHash =
        "0x1a2f334228cee715f1f0f54053bb6b5eac54fa336e0bc1aacf7516decb0471d";
      const receiptWithEvents = receipt as any;
      if (
        receiptWithEvents.events &&
        Array.isArray(receiptWithEvents.events) &&
        receiptWithEvents.events.length > 0
      ) {
        for (let i = 0; i < receiptWithEvents.events.length; i++) {
          const event = receiptWithEvents.events[i];

          // Check if this event has the GameCreated hash in its keys
          // The event hash is usually in keys[0] or could be in any key position
          if (event.keys && Array.isArray(event.keys)) {
            const hasGameCreatedHash = event.keys.some(
              (key: string) =>
                key.toLowerCase() === gameCreatedEventHash.toLowerCase(),
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
                  console.log(
                    "[Login] ⚠️ Invalid game_id extracted from data[3]:",
                    gameId,
                  );
                }
              } else {
                console.log(
                  "[Login] ⚠️ Event data doesn't have enough elements (need at least 4, got:",
                  event.data?.length,
                  ")",
                );
              }
            }
          }
        }

        console.log("[Login] ⚠️ GameCreated event not found in receipt events");
      }
      console.log(
        "[Login] Could not extract game_id from events, checking transaction...",
      );
      setProcessingStatus(null); // Close modal
      toast.success("Game creation transaction submitted!");
    } catch (error) {
      console.error("[Login] Error creating game:", error);
      setProcessingStatus(null); // Close modal on error
      toast.error(
        `Failed to create game: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      // Reset both state and ref
      isCreatingGameRef.current = false;
      setIsCreatingGame(false);
    }
  };

  const connectingRef = useRef(false);

  const handleConnect = async () => {
    if (!account && !isConnecting) {
      try {
        console.log("[Login] Connecting with Controller...");
        connectingRef.current = true;
        await connect();
      } catch (error) {
        console.error("[Login] Error connecting:", error);
        connectingRef.current = false;
        toast.error("Failed to connect");
      }
    }
  };

  // Show success toast when connection is complete
  useEffect(() => {
    if (isConnected && account && connectingRef.current) {
      toast.success("Connected with Controller!");
      connectingRef.current = false;
    }
  }, [isConnected, account]);

  const handleCreateGame = async () => {
    // Prevent multiple clicks
    if (isCreatingGame) {
      console.log(
        "[Login] ⚠️ Game creation already in progress, ignoring click",
      );
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
      // Use username from Controller, fallback to "ZStarknet" if not available
      const nameToUse = username || "ZStarknet";
      console.log(
        "[Login] Joining game with ID:",
        gameId,
        "and name:",
        nameToUse,
      );

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

      // Update modal - waiting for confirmation
      setProcessingStatus({
        title: "JOINING GAME",
        message: "Submitting transaction ...",
      });

      // Execute the join function
      const result = await account.execute({
        contractAddress: GAME_CONTRACT_ADDRESS,
        entrypoint: "join",
        calldata: [gameId.toString(), ...serializedByteArray],
      });

      console.log("[Login] Transaction hash:", result.transaction_hash);

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
      toast.error(
        `Failed to join game: ${error instanceof Error ? error.message : String(error)}`,
      );
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
            <span
              className="login-connected-text"
            >
              {isConnected && (
                <>
                  <img
                    src="/images/icons/cartridge.png"
                    alt="Controller"
                    style={{ height: "clamp(1rem, 2vw, 1.5rem)" }}
                  />
                  <span>CONTROLLER CONNECTED</span>
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
                {/* Display username from Controller */}
                {isLoadingUsername ? (
                  <div className="login-username-display">Loading username...</div>
                ) : username ? (
                  <div className="login-username-display">Playing as: {username}</div>
                ) : (
                  <div className="login-username-display">Playing as: ZStarknet</div>
                )}
                <Button
                  onClick={handleCreateGame}
                  className="login-button"
                  variant="default"
                  disabled={isCreatingGame || isLoadingUsername}
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
                disabled={isConnecting}
                style={{
                  background:
                    "linear-gradient(135deg,rgb(242, 165, 59) 0%, rgb(214, 87, 13) 100%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5em",
                }}
              >
                {isConnecting ? "Connecting..." : "CONNECT WITH CONTROLLER"}
              </Button>
              <p className="login-wallet-support-text">
                Connect with Cartridge Controller on Sepolia
              </p>
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
