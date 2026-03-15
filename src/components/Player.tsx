import { useEffect, useRef } from "react";
import * as AsciinemaPlayer from "asciinema-player";
import "asciinema-player/dist/bundle/asciinema-player.css";

interface PlayerProps {
  castContent: string;
  width?: number;
  height?: number;
  onPlayerReady?: (player: AsciinemaPlayer.Player) => void;
  onPlayerDispose?: () => void;
}

export function Player({ castContent, width, height, onPlayerReady, onPlayerDispose }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<AsciinemaPlayer.Player | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const player = AsciinemaPlayer.create(
      "data:text/plain;base64," + btoa(unescape(encodeURIComponent(castContent))),
      containerRef.current,
      {
        cols: width,
        rows: height,
        autoPlay: false,
        preload: true,
        controls: false,
        fit: "both",
      }
    );
    playerRef.current = player;
    onPlayerReady?.(player);

    return () => {
      onPlayerDispose?.();
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, [castContent, width, height, onPlayerReady, onPlayerDispose]);

  return <div ref={containerRef} data-testid="player-container" className="player-container" />;
}
