import { useEffect, useRef } from "react";
import * as AsciinemaPlayer from "asciinema-player";
import "asciinema-player/dist/bundle/asciinema-player.css";
import type { FontConfig } from "../types/fontConfig";

interface PlayerProps {
  castContent: string;
  width: number;
  height: number;
  fontConfig?: FontConfig;
  onPlayerReady: (player: AsciinemaPlayer.Player) => void;
  onPlayerDispose: () => void;
}

export function Player({ castContent, width, height, fontConfig, onPlayerReady, onPlayerDispose }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<AsciinemaPlayer.Player | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const createOptions: Record<string, unknown> = {
      cols: width,
      rows: height,
      autoPlay: false,
      preload: true,
      controls: false,
      fit: fontConfig ? "width" : "both",
    };
    if (fontConfig?.fontFamily) {
      createOptions.terminalFontFamily = fontConfig.fontFamily;
    }
    if (fontConfig) {
      createOptions.terminalFontSize = `${fontConfig.fontSize}px`;
      createOptions.terminalLineHeight = fontConfig.lineHeight;
    }

    const player = AsciinemaPlayer.create(
      "data:text/plain," + encodeURIComponent(castContent),
      containerRef.current,
      createOptions
    );
    playerRef.current = player;
    onPlayerReady(player);

    return () => {
      onPlayerDispose();
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, [castContent, width, height, fontConfig, onPlayerReady, onPlayerDispose]);

  const containerStyle: React.CSSProperties = fontConfig ? {
    "--terminal-letter-spacing": `${fontConfig.letterSpacing}px`,
    "--terminal-ligatures": fontConfig.ligatures ? "normal" : "none",
  } as React.CSSProperties : {};

  return <div ref={containerRef} data-testid="player-container" className="player-container" style={containerStyle} />;
}
