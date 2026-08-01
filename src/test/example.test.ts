import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("should handle conditional classes", () => {
    expect(cn("base-class", false && "conditional-class")).toBe("base-class");
    expect(cn("base-class", true && "conditional-class")).toBe("base-class conditional-class");
  });

  it("should handle undefined and null values", () => {
    expect(cn("base-class", undefined, null)).toBe("base-class");
  });

  it("should handle Tailwind conflicts correctly", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("should handle empty input", () => {
    expect(cn()).toBe("");
  });
});
