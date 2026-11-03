import { describe, expect, it } from "vitest";
import { MESSAGES } from "./messages";

/** The shape of a catalogue, with functions and arrays reduced to markers, for comparing languages. */
function shape(value: unknown): unknown {
  if (typeof value === "function") return `fn/${value.length}`;
  if (Array.isArray(value)) return `array/${value.length}`;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, shape((value as Record<string, unknown>)[key])])
    );
  }
  return typeof value;
}

const LOCALES = ["en", "it", "nl", "de"] as const;

describe("LLM Council catalogue (roadmap row 6)", () => {
  it("has the same keys, functions and list lengths in every language", () => {
    const english = shape(MESSAGES.en);
    for (const locale of ["it", "nl", "de"] as const) {
      expect(shape(MESSAGES[locale]), locale).toEqual(english);
    }
  });

  it("names every panel member and every human-in-loop value the backend sends", () => {
    for (const locale of LOCALES) {
      const t = MESSAGES[locale];
      for (const id of ["claude", "gemini", "openai"] as const) {
        expect(t.members[id].role, `${locale} ${id}`).toBeTruthy();
      }
      for (const value of ["not_required", "recommended", "required", "completed"] as const) {
        expect(t.governance[value], `${locale} ${value}`).toBeTruthy();
      }
    }
  });

  it("keeps the confidence threshold the backend uses (0.65) in every language", () => {
    for (const locale of LOCALES) {
      expect(MESSAGES[locale].status.facts.join(" "), locale).toMatch(/0[.,]65/);
    }
  });
});
