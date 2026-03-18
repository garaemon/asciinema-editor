// Dynamically load web fonts from Google Fonts CDN.
// Nerd Fonts require local installation — no reliable CDN hosts them.

const GOOGLE_FONTS: Record<string, string> = {
  "Fira Code": "Fira+Code",
  "JetBrains Mono": "JetBrains+Mono",
  "Source Code Pro": "Source+Code+Pro",
  "IBM Plex Mono": "IBM+Plex+Mono",
  "Cascadia Code": "Cascadia+Mono",
};

const loadedFonts = new Set<string>();

export function loadFont(fontFamily: string): void {
  if (!fontFamily || loadedFonts.has(fontFamily)) {
    return;
  }

  const googleName = GOOGLE_FONTS[fontFamily];
  if (!googleName) {
    // Nerd Fonts and others rely on local installation
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${googleName}&display=swap`;
  document.head.appendChild(link);
  loadedFonts.add(fontFamily);
}

export function requiresLocalInstall(fontFamily: string): boolean {
  return !!fontFamily && !GOOGLE_FONTS[fontFamily];
}
