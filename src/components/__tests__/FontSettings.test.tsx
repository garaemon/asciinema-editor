import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { FontSettings } from "../FontSettings";
import { DEFAULT_FONT_CONFIG } from "../../types/fontConfig";

describe("FontSettings", () => {
  it("renders font family dropdown with default selected", () => {
    const onChange = vi.fn();
    render(<FontSettings fontConfig={DEFAULT_FONT_CONFIG} onFontConfigChange={onChange} />);

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("");
  });

  it("renders Web Fonts and Nerd Fonts option groups", () => {
    const onChange = vi.fn();
    render(<FontSettings fontConfig={DEFAULT_FONT_CONFIG} onFontConfigChange={onChange} />);

    const options = screen.getAllByRole("option");
    // 6 standard + 4 nerd = 10 options
    expect(options).toHaveLength(10);
    expect(options.map((o) => o.textContent)).toContain("Fira Code");
    expect(options.map((o) => o.textContent)).toContain("Hack Nerd Font");
  });

  it("calls onFontConfigChange when font is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FontSettings fontConfig={DEFAULT_FONT_CONFIG} onFontConfigChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "JetBrains Mono");
    expect(onChange).toHaveBeenCalledWith({ fontFamily: "JetBrains Mono" });
  });

  it("does not show local install hint for web fonts", () => {
    const onChange = vi.fn();
    render(
      <FontSettings fontConfig={{ fontFamily: "Fira Code" }} onFontConfigChange={onChange} />
    );
    expect(screen.queryByText("Requires local installation")).not.toBeInTheDocument();
  });

  it("shows local install hint for Nerd Fonts", () => {
    const onChange = vi.fn();
    render(
      <FontSettings fontConfig={{ fontFamily: "Hack Nerd Font" }} onFontConfigChange={onChange} />
    );
    expect(screen.getByText("Requires local installation")).toBeInTheDocument();
  });
});
