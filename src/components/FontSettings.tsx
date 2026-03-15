import type { FontConfig } from "../types/fontConfig";
import { loadFont, requiresLocalInstall } from "../lib/font-loader";

const FONT_OPTIONS = [
  { label: "Default", value: "", group: "standard" },
  { label: "Fira Code", value: "Fira Code", group: "standard" },
  { label: "JetBrains Mono", value: "JetBrains Mono", group: "standard" },
  { label: "Source Code Pro", value: "Source Code Pro", group: "standard" },
  { label: "Cascadia Code", value: "Cascadia Code", group: "standard" },
  { label: "IBM Plex Mono", value: "IBM Plex Mono", group: "standard" },
  { label: "Hack Nerd Font", value: "Hack Nerd Font", group: "nerd" },
  { label: "FiraCode Nerd Font", value: "FiraCode Nerd Font", group: "nerd" },
  { label: "JetBrainsMono Nerd Font", value: "JetBrainsMono Nerd Font", group: "nerd" },
  { label: "CascadiaCode Nerd Font", value: "CascadiaCode Nerd Font", group: "nerd" },
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
          onChange={(e) => {
            loadFont(e.target.value);
            onFontConfigChange(updateConfig(fontConfig, "fontFamily", e.target.value));
          }}
        >
          <optgroup label="Web Fonts">
            {FONT_OPTIONS.filter((o) => o.group === "standard").map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </optgroup>
          <optgroup label="Nerd Fonts (local install required)">
            {FONT_OPTIONS.filter((o) => o.group === "nerd").map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </optgroup>
        </select>
        {requiresLocalInstall(fontConfig.fontFamily) && (
          <p className="font-local-hint">Requires local installation</p>
        )}
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
