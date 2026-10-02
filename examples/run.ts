import { quoteBuy, quoteSell, type CurveConfig, type CurveState } from "../src/index";

const E18 = 10n ** 18n;
const config: CurveConfig = { feeBps: 100n, graduationBase: 24n * E18 };
const initial: CurveState = {
  virtualBase: 30n * E18,
  virtualToken: 1_000_000_000n * E18,
  realBaseRaised: 0n,
  feesAccrued: 0n,
  graduated: false
};

const buy = quoteBuy(config, initial, 2n * E18);
const sell = quoteSell(config, buy.stateAfter, buy.amountOut / 4n);
console.log(JSON.stringify({ buy, sell }, (_, value) => typeof value === "bigint" ? value.toString() : value, 2));
