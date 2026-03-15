export interface FontConfig {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  ligatures: boolean;
}

export const DEFAULT_FONT_CONFIG: FontConfig = {
  fontFamily: "",
  fontSize: 14,
  lineHeight: 1.4,
  letterSpacing: 0,
  ligatures: true,
};
