export const BPS = 10_000n;

export function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new Error("denominator must be positive");
  return (numerator + denominator - 1n) / denominator;
}

export function feeFor(amount: bigint, feeBps: bigint): bigint {
  return amount * feeBps / BPS;
}

export function minimumAfterSlippage(amount: bigint, slippageBps: bigint): bigint {
  if (slippageBps < 0n || slippageBps >= BPS) throw new Error("slippageBps must be between 0 and 9999");
  return amount * (BPS - slippageBps) / BPS;
}

export function impactBps(idealOut: bigint, actualOut: bigint): bigint {
  if (idealOut <= 0n || actualOut >= idealOut) return 0n;
  return (idealOut - actualOut) * BPS / idealOut;
}
