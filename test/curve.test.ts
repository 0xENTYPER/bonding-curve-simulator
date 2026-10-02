import { describe, expect, it } from "vitest";
import { quoteBuy, quoteSell, type CurveConfig, type CurveState } from "../src/index";

const E18 = 10n ** 18n;
const config: CurveConfig = { feeBps: 100n, graduationBase: 24n * E18 };
const state = (): CurveState => ({
  virtualBase: 30n * E18,
  virtualToken: 1_000_000_000n * E18,
  realBaseRaised: 0n,
  feesAccrued: 0n,
  graduated: false
});

describe("constant-product curve", () => {
  it("preserves or increases the rounded invariant after a buy", () => {
    const before = state();
    const quote = quoteBuy(config, before, E18);
    expect(quote.stateAfter.virtualBase * quote.stateAfter.virtualToken).toBeGreaterThanOrEqual(before.virtualBase * before.virtualToken);
  });

  it("preserves or increases the rounded invariant after a sell", () => {
    const before = state();
    const quote = quoteSell(config, before, 10_000_000n * E18);
    expect(quote.stateAfter.virtualBase * quote.stateAfter.virtualToken).toBeGreaterThanOrEqual(before.virtualBase * before.virtualToken);
  });

  it("quotes more tokens for a larger buy", () => {
    expect(quoteBuy(config, state(), 2n * E18).amountOut).toBeGreaterThan(quoteBuy(config, state(), E18).amountOut);
  });

  it("accrues the configured fee", () => {
    const quote = quoteBuy(config, state(), E18);
    expect(quote.fee).toBe(E18 / 100n);
    expect(quote.stateAfter.feesAccrued).toBe(quote.fee);
  });

  it("applies slippage tolerance to minimum output", () => {
    const quote = quoteBuy(config, state(), E18, 250n);
    expect(quote.minimumOut).toBe(quote.amountOut * 9750n / 10_000n);
  });

  it("does not create profit on an immediate round trip", () => {
    const buy = quoteBuy(config, state(), E18);
    const sell = quoteSell(config, buy.stateAfter, buy.amountOut);
    expect(sell.amountOut).toBeLessThan(E18);
  });

  it("graduates when net raised base reaches the threshold", () => {
    const near = { ...state(), realBaseRaised: 23n * E18 };
    expect(quoteBuy(config, near, 2n * E18).stateAfter.graduated).toBe(true);
  });

  it("blocks trading after graduation", () => {
    expect(() => quoteBuy(config, { ...state(), graduated: true }, E18)).toThrow("graduated");
  });

  it("rejects invalid fee and slippage parameters", () => {
    expect(() => quoteBuy({ ...config, feeBps: 10_000n }, state(), E18)).toThrow("feeBps");
    expect(() => quoteBuy(config, state(), E18, 10_000n)).toThrow("slippageBps");
  });
});
