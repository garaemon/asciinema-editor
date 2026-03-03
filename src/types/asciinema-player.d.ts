declare module "asciinema-player" {
  interface PlayerOptions {
    cols?: number;
    rows?: number;
    autoPlay?: boolean;
    preload?: boolean;
    loop?: boolean | number;
    speed?: number;
    startAt?: string;
    theme?: string;
    poster?: string;
    controls?: boolean | "auto";
    fit?: "width" | "height" | "both" | false;
    terminalFontSize?: string;
    terminalFontFamily?: string;
    terminalLineHeight?: string;
    idleTimeLimit?: number;
    pauseOnMarkers?: boolean;
    logger?: Console;
  }

  interface Player {
    el: HTMLElement;
    play(): Promise<void>;
    pause(): Promise<void>;
    seek(position: number): Promise<void>;
    getCurrentTime(): Promise<number>;
    getDuration(): Promise<number | null>;
    addEventListener(
      eventName: string,
      handler: (data?: unknown) => void
    ): void;
    dispose(): void;
  }

  function create(
    src: string,
    containerElement: HTMLElement,
    options?: PlayerOptions
  ): Player;
}
