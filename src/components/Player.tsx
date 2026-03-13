import { useEffect, useRef } from "react";
import * as AsciinemaPlayer from "asciinema-player";
import "asciinema-player/dist/bundle/asciinema-player.css";

interface PlayerProps {
  castContent: string;
  width?: number;
  height?: number;
}

export function Player({ castContent, width, height }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<AsciinemaPlayer.Player | null>(null);

  useEffect(() => {
    if (!containerRef.current) {return;}

    const blob = new Blob([castContent], { type: "text/plain" });
    const blobUrl = URL.createObjectURL(blob);

    playerRef.current = AsciinemaPlayer.create(
      blobUrl,
      containerRef.current,
      {
        cols: width,
        rows: height,
        autoPlay: false,
        controls: true,
        fit: "both",
      }
    );

    return () => {
      playerRef.current?.dispose();
      playerRef.current = null;
      URL.revokeObjectURL(blobUrl);
    };
  }, [castContent, width, height]);

  return <div ref={containerRef} data-testid="player-container" />;
}
