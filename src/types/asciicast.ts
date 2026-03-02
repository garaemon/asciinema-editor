// Asciicast v2 format type definitions
// See: https://docs.asciinema.org/manual/asciicast/v2/

// "o": terminal output (stdout)
// "i": keyboard input (stdin)
// "m": marker (breakpoint/navigation label)
// "r": terminal resize (e.g. "120x40")
export type EventType = "o" | "i" | "m" | "r";

export interface AsciicastHeader {
  version: 2;
  width: number;
  height: number;
  timestamp?: number;
  duration?: number;
  idle_time_limit?: number;
  command?: string;
  title?: string;
  env?: Record<string, string>;
  theme?: {
    fg?: string;
    bg?: string;
    palette?: string;
  };
}

// [time, event_type, data]
export type AsciicastEvent = [number, EventType, string];

export interface AsciicastData {
  header: AsciicastHeader;
  events: AsciicastEvent[];
}
