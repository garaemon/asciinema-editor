// Asciicast v2/v3 format type definitions
// v2: https://docs.asciinema.org/manual/asciicast/v2/
// v3: https://docs.asciinema.org/manual/asciicast/v3/

// "o": terminal output (stdout)
// "i": keyboard input (stdin)
// "m": marker (breakpoint/navigation label)
// "r": terminal resize (e.g. "120x40")
// "x": exit (process exit code, v3 origin but also found in some v2 files)
export type EventType = "o" | "i" | "m" | "r" | "x";

// Normalized header: width/height are always top-level regardless of source version
export interface AsciicastHeader {
  version: 2 | 3;
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
  // v3-specific fields
  tags?: string[];
  term?: {
    type?: string;
    version?: string;
  };
}

// Events always use absolute timestamps internally
// v3 relative timestamps are converted to absolute on parse
// [time, event_type, data]
export type AsciicastEvent = [number, EventType, string];

export interface AsciicastData {
  header: AsciicastHeader;
  events: AsciicastEvent[];
}
