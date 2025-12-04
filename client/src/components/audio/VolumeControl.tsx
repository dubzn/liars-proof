import { useState, useEffect } from "react";
import "./VolumeControl.css";

const VOLUME_STORAGE_KEY = "liars_proof_volume";
const DEFAULT_VOLUME = 0.3;
const VOLUME_STEP = 0.1;
const MIN_VOLUME = 0;
const MAX_VOLUME = 1;

interface VolumeControlProps {
  audioRef: React.RefObject<HTMLAudioElement>;
}

export const VolumeControl = ({ audioRef }: VolumeControlProps) => {
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(DEFAULT_VOLUME);

  // Load volume from localStorage on mount
  useEffect(() => {
    const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (savedVolume) {
      const parsedVolume = parseFloat(savedVolume);
      if (!isNaN(parsedVolume) && parsedVolume >= MIN_VOLUME && parsedVolume <= MAX_VOLUME) {
        setVolume(parsedVolume);
        setPreviousVolume(parsedVolume);
      }
    }
  }, []);

  // Apply volume to audio element
  useEffect(() => {
    if (audioRef.current) {
      // Apply volume immediately, overriding any fade-in animation
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, audioRef]);

  const handleVolumeUp = () => {
    const newVolume = Math.min(volume + VOLUME_STEP, MAX_VOLUME);
    setVolume(newVolume);
    setIsMuted(false);
    localStorage.setItem(VOLUME_STORAGE_KEY, newVolume.toString());
  };

  const handleVolumeDown = () => {
    const newVolume = Math.max(volume - VOLUME_STEP, MIN_VOLUME);
    setVolume(newVolume);
    if (newVolume === MIN_VOLUME) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
    localStorage.setItem(VOLUME_STORAGE_KEY, newVolume.toString());
  };

  const handleToggleMute = () => {
    if (isMuted) {
      // Unmute: restore previous volume or default
      const volumeToRestore = previousVolume > 0 ? previousVolume : DEFAULT_VOLUME;
      setVolume(volumeToRestore);
      setIsMuted(false);
      localStorage.setItem(VOLUME_STORAGE_KEY, volumeToRestore.toString());
    } else {
      // Mute: save current volume and set to 0
      setPreviousVolume(volume);
      setIsMuted(true);
    }
  };

  const volumePercentage = Math.round(volume * 100);

  return (
    <div className="volume-control">
      <button
        onClick={handleVolumeDown}
        className="volume-button volume-button-down"
        title="Decrease volume"
        aria-label="Decrease volume"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      </button>
      
      <button
        onClick={handleToggleMute}
        className={`volume-button volume-button-mute ${isMuted ? "muted" : ""}`}
        title={isMuted ? "Unmute" : "Mute"}
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>

      <button
        onClick={handleVolumeUp}
        className="volume-button volume-button-up"
        title="Increase volume"
        aria-label="Increase volume"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          <line x1="15" y1="12" x2="23" y2="12" />
        </svg>
      </button>

      <div className="volume-indicator" title={`Volume: ${volumePercentage}%`}>
        {volumePercentage}%
      </div>
    </div>
  );
};

