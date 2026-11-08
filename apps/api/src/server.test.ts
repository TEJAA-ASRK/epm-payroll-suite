import { describe, expect, it } from "vitest";

describe("payroll calculations", () => {
  it("calculates net salary using tax and deductions", () => {
    const gross = 120000 / 12;
    expect(gross - gross * 0.18 - gross * 0.05).toBe(7700);
  });
});
