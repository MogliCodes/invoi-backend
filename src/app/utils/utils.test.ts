import { describe, it, expect } from "vitest";
import { isEmptyObject } from "./utils.ts";

describe("isEmptyObject", () => {
  it("returns true for an empty object", () => {
    expect(isEmptyObject({})).toBe(true);
  });

  it("returns false for a non-empty object", () => {
    expect(isEmptyObject({ key: "value" })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isEmptyObject(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isEmptyObject(undefined)).toBe(false);
  });

  it("returns false for a non-object type (number)", () => {
    expect(isEmptyObject(123)).toBe(false);
  });

  it("returns false for a non-object type (string)", () => {
    expect(isEmptyObject("string")).toBe(false);
  });

  it("returns false for a non-object type (array)", () => {
    expect(isEmptyObject([1, 2, 3])).toBe(false);
  });
});
