import { useEffect, useRef, useState, useCallback } from "react";
import type { Player } from "asciinema-player";

interface TimelineProps {
  player: Player | null;
  totalDuration: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function Timeline({ player, totalDuration }: TimelineProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const isSeekingRef = useRef(false);
  const animationFrameRef = useRef<number>(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef(player);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    if (!player) {
      return;
    }

    function pollTime() {
      const currentPlayer = playerRef.current;
      if (!currentPlayer || isSeekingRef.current) {
        animationFrameRef.current = requestAnimationFrame(pollTime);
        return;
      }
      currentPlayer.getCurrentTime().then((time) => {
        setCurrentTime(time);
      });
      animationFrameRef.current = requestAnimationFrame(pollTime);
    }

    animationFrameRef.current = requestAnimationFrame(pollTime);
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [player]);

  useEffect(() => {
    if (!player) {
      return;
    }
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    player.addEventListener("play", handlePlay);
    player.addEventListener("pause", handlePause);
    player.addEventListener("ended", handleEnded);
  }, [player]);

  const handleTogglePlay = useCallback(() => {
    if (!player) {
      return;
    }
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, isPlaying]);

  const computeTimeFromEvent = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) {
        return 0;
      }
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * totalDuration;
    },
    [totalDuration]
  );

  const handleTrackMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!player) {
        return;
      }
      isSeekingRef.current = true;
      const seekTime = computeTimeFromEvent(e.clientX);
      setCurrentTime(seekTime);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const moveTime = computeTimeFromEvent(moveEvent.clientX);
        setCurrentTime(moveTime);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        const finalTime = computeTimeFromEvent(upEvent.clientX);
        player.seek(finalTime);
        player.pause();
        setCurrentTime(finalTime);
        setIsPlaying(false);
        isSeekingRef.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [player, computeTimeFromEvent]
  );

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  if (!player) {
    return (
      <div className="timeline" data-testid="timeline">
        <p className="placeholder">Load a file to see the timeline</p>
      </div>
    );
  }

  return (
    <div className="timeline" data-testid="timeline">
      <button
        className="timeline-play-button"
        onClick={handleTogglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "\u275A\u275A" : "\u25B6"}
      </button>
      <span className="timeline-time">{formatTime(currentTime)}</span>
      <div
        className="timeline-track"
        ref={trackRef}
        onMouseDown={handleTrackMouseDown}
        role="slider"
        aria-label="Playback position"
        aria-valuemin={0}
        aria-valuemax={totalDuration}
        aria-valuenow={currentTime}
        tabIndex={0}
      >
        <div
          className="timeline-progress"
          style={{ width: `${progress}%` }}
        />
        <div
          className="timeline-thumb"
          style={{ left: `${progress}%` }}
        />
      </div>
      <span className="timeline-time">{formatTime(totalDuration)}</span>
    </div>
  );
}
