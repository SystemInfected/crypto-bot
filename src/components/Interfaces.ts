export interface GlobalConfig {
	/** Interval (minutes) inbetween each request for current values
	 * Coingecko caching is about 2-3 minutes so anything under that is unnecessary */
	tickInterval: number
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
	/** Finetuning of when to buy or sell */
	buySellBuffer: number
}

export enum IndicationType {
	BUY,
	SELL,
	STAY,
}
