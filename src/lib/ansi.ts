// Regex to match ANSI escape sequences (CSI, OSC, and simple escapes)
const ANSI_PATTERN =
  // eslint-disable-next-line no-control-regex
  /\x1b\[[0-9;]*[A-Za-z]|\x1b\][^\x07]*\x07|\x1b[^[\]]/g;

/** Strip ANSI escape codes from text for display purposes */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, "");
}
