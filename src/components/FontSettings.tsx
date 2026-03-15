import type { FontConfig } from "../types/fontConfig";

const FONT_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Fira Code", value: "Fira Code" },
  { label: "JetBrains Mono", value: "JetBrains Mono" },
  { label: "Source Code Pro", value: "Source Code Pro" },
  { label: "Cascadia Code", value: "Cascadia Code" },
  { label: "IBM Plex Mono", value: "IBM Plex Mono" },
  { label: "Hack Nerd Font", value: "Hack Nerd Font" },
  { label: "FiraCode Nerd Font", value: "FiraCode Nerd Font" },
  { label: "JetBrainsMono Nerd Font", value: "JetBrainsMono Nerd Font" },
  { label: "CascadiaCode Nerd Font", value: "CascadiaCode Nerd Font" },
];

interface FontSettingsProps {
  fontConfig: FontConfig;
  onFontConfigChange: (config: FontConfig) => void;
}

function updateConfig(config: FontConfig, key: keyof FontConfig, value: string | number | boolean): FontConfig {
  return { ...config, [key]: value };
}

export function FontSettings({ fontConfig, onFontConfigChange }: FontSettingsProps) {
  return (
    <div className="font-settings">
      <div className="control-group">
        <label>Family</label>
        <select
          className="font-select"
          value={fontConfig.fontFamily}
          onChange={(e) => onFontConfigChange(updateConfig(fontConfig, "fontFamily", e.target.value))}
        >
          {FONT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="control-group">
        <label>Size (px)</label>
        <input
          type="number"
          min={8}
          max={32}
          value={fontConfig.fontSize}
          onChange={(e) => onFontConfigChange(updateConfig(fontConfig, "fontSize", Number(e.target.value)))}
        />
      </div>
      <div className="control-group">
        <label>Line Height</label>
        <input
          type="number"
          min={1.0}
          max={2.0}
          step={0.1}
          value={fontConfig.lineHeight}
          onChange={(e) => onFontConfigChange(updateConfig(fontConfig, "lineHeight", Number(e.target.value)))}
        />
      </div>
      <div className="control-group">
        <label>Letter Spacing (px)</label>
        <input
          type="number"
          min={-2}
          max={5}
          step={0.5}
          value={fontConfig.letterSpacing}
          onChange={(e) => onFontConfigChange(updateConfig(fontConfig, "letterSpacing", Number(e.target.value)))}
        />
      </div>
      <div className="control-group">
        <label className="font-checkbox-label">
          <input
            type="checkbox"
            checked={fontConfig.ligatures}
            onChange={(e) => onFontConfigChange(updateConfig(fontConfig, "ligatures", e.target.checked))}
          />
          Ligatures
        </label>
      </div>
    </div>
  );
}
