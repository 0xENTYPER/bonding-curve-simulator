export interface CurveConfig {
  feeBps: bigint;
  graduationBase: bigint;
}

export interface CurveState {
  virtualBase: bigint;
  virtualToken: bigint;
  realBaseRaised: bigint;
  feesAccrued: bigint;
  graduated: boolean;
}

export interface TradeQuote {
  side: "buy" | "sell";
  amountIn: bigint;
  amountOut: bigint;
  fee: bigint;
  minimumOut: bigint;
  priceImpactBps: bigint;
  stateAfter: CurveState;
}
