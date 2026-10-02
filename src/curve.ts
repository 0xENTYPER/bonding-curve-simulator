import { BPS, ceilDiv, feeFor, impactBps, minimumAfterSlippage } from "./math";
import type { CurveConfig, CurveState, TradeQuote } from "./model";

function validate(config: CurveConfig, state: CurveState, amount: bigint): void {
  if (amount <= 0n) throw new Error("amount must be positive");
  if (state.virtualBase <= 0n || state.virtualToken <= 0n) throw new Error("virtual reserves must be positive");
  if (config.feeBps < 0n || config.feeBps >= BPS) throw new Error("feeBps must be between 0 and 9999");
  if (state.graduated) throw new Error("curve has graduated");
}

export function quoteBuy(
  config: CurveConfig,
  state: CurveState,
  baseIn: bigint,
  slippageBps = 100n
): TradeQuote {
  validate(config, state, baseIn);
  const fee = feeFor(baseIn, config.feeBps);
  const netBase = baseIn - fee;
  if (netBase <= 0n) throw new Error("trade is fully consumed by fees");
  const invariant = state.virtualBase * state.virtualToken;
  const nextBase = state.virtualBase + netBase;
  const nextToken = ceilDiv(invariant, nextBase);
  const tokenOut = state.virtualToken - nextToken;
  if (tokenOut <= 0n) throw new Error("trade is too small for reserve precision");
  const idealOut = netBase * state.virtualToken / state.virtualBase;
  const realBaseRaised = state.realBaseRaised + netBase;

  return {
    side: "buy",
    amountIn: baseIn,
    amountOut: tokenOut,
    fee,
    minimumOut: minimumAfterSlippage(tokenOut, slippageBps),
    priceImpactBps: impactBps(idealOut, tokenOut),
    stateAfter: {
      virtualBase: nextBase,
      virtualToken: nextToken,
      realBaseRaised,
      feesAccrued: state.feesAccrued + fee,
      graduated: realBaseRaised >= config.graduationBase
    }
  };
}

export function quoteSell(
  config: CurveConfig,
  state: CurveState,
  tokenIn: bigint,
  slippageBps = 100n
): TradeQuote {
  validate(config, state, tokenIn);
  const invariant = state.virtualBase * state.virtualToken;
  const nextToken = state.virtualToken + tokenIn;
  const nextBase = ceilDiv(invariant, nextToken);
  const grossBaseOut = state.virtualBase - nextBase;
  if (grossBaseOut <= 0n) throw new Error("trade is too small for reserve precision");
  const fee = feeFor(grossBaseOut, config.feeBps);
  const baseOut = grossBaseOut - fee;
  const idealOut = tokenIn * state.virtualBase / state.virtualToken;
  const realBaseRaised = state.realBaseRaised > grossBaseOut ? state.realBaseRaised - grossBaseOut : 0n;

  return {
    side: "sell",
    amountIn: tokenIn,
    amountOut: baseOut,
    fee,
    minimumOut: minimumAfterSlippage(baseOut, slippageBps),
    priceImpactBps: impactBps(idealOut, grossBaseOut),
    stateAfter: {
      virtualBase: nextBase,
      virtualToken: nextToken,
      realBaseRaised,
      feesAccrued: state.feesAccrued + fee,
      graduated: false
    }
  };
}
