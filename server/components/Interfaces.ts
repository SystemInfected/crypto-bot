import { Balance } from 'ccxt'

export interface GlobalConfig {
	/** Cryptocurrency to trade (i.e. Etherium) */
	coin: {
		shortName: string
		fullName: string
	}
	/** Stable coin to compare against (Tether recommended) */
	stableCoin: {
		shortName: string
		fullName: string
	}
	/** Minimum allowed trade of assets at exchange.
	 *I.e 0.0001 ETH at Binance */
	minTradeAmount: number
	/** Minimum allowed order size at exchange.
	 *I.e 10 USDT at Binance */
	minOrderSize: number
	/** Minimum gain percentage to sell */
	minGainPercentage: number
	/** Allocation of assets at exchange */
	allocation: number
	/** "Interval (minutes) inbetween each request for current values.
	 *I.e. allowed intervals for Binance is 1m, 3m, 5m, 15m, 30m */
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
	/** Amount of values included in ATR calculation */
	atrWMA: number
	/** Finetuning of when to buy */
	buyBuffer: number
	/** Multiplier of 12h price change to avoid buying at false positive (too close to 12 closing price) */
	falsePositiveBuffer: number
	/** Finetuning of when to sell */
	sellBuffer: number
	/** Multiplier of ATR to set sell point */
	atrMultiplier: number
}

export enum IndicationType {
	BUY,
	SELL,
	HODL,
}

export interface StartupDataProps {
	time: string
	timestamp: number
}

export interface BuySellHistoryProps {
	time: string
	status: IndicationType
	coin: string
	buyAmount: number
	buyCost: number
	averagePrice: number
	result?: number
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

export interface OpenOrder {
	[key: string]: {
		time: string
		orderId: string
		type: IndicationType
		currentBalance: number
		buyPrice: number
		buyAmount: number
		averagePrice: number
		remaining: number
	}
}

export interface TickerValue {
	timestamp: number
	open: number
	high: number
	low: number
	close: number
	volume: number
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

export interface StoredTransactionsProps {
	time: number
	type: string
	coinPair: string
	price: number
	amount: number
	cost: number
	fee: number
	feeCurrency: string
	result?: number
}

export interface BalanceResponse {
	total: Balance
	currentStableCoin: number
	currentCoin: number
}
