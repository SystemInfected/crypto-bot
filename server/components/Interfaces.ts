export interface GlobalConfig {
	/** Cryptocurrency to trade (i.e. Etherium) */
	coin: {
		short: string
		coingeckoId: string
	}
	/** Stable coin to compare against (Tether recommended) */
	stableCoin: {
		short: string
		coingeckoId: string
	}
	/** Interval (minutes) inbetween each request for current values
	 * Coingecko caching is about 2-3 minutes so anything under that is unnecessary */
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
		price: number
		atr: number
		config: GlobalConfig
	}
}
