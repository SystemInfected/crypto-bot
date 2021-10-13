export interface GlobalConfig {
	/** Cryptocurrency to trade (i.e. Etherium) */
	coin: {
		shortName: string
		longName: string
		fullName: string
	}
	/** Stable coin to compare against (Tether recommended) */
	stableCoin: {
		shortName: string
		longName: string
		fullName: string
	}
	/** Allocation of assets at exchange */
	allocation: number
	/** "Interval (minutes) inbetween each request for current values.
	 * Allowed intervals for Binance is 1m, 3m, 5m, 15m, 30m */
	tickInterval: number
	/** Max amount of orders at the same time */
	concurrentOrders: number
	/** For ROC 14 at least 15 intervals are needed */
	minInitialValues: number
	/** For WMA 10 of ROC 14 at least 25 intervals are needed */
	minAlgorithmValues: number
	/** Usually ROC 14 */
	longROC: number
	/** Usually ROC 11 */
	shortROC: number
	/** Usually WMA 10 */
	WMA: number
	/** Finetuning of when to buy */
	buyBuffer: number
	/** Multiplier of 24h price change to avoid buying at false positive (too close to daily high) */
	falsePositiveBuffer: number
	/** Finetuning of when to sell */
	sellBuffer: number
	/** Multiplier of ATR to set sell point */
	ATRmultiplier: number
}

export enum IndicationType {
	BUY,
	SELL,
	HODL,
}

export interface CurrentBuy {
	[key: string]: {
		time: string
		buyPrice: number
		buyAmount: number
		averagePrice: number
		atr: number
	}
}

export interface CoinValuesProps {
	timestamp: number
	open: number
	high: number
	low: number
	close: number
	volume: number
	average: number
}
