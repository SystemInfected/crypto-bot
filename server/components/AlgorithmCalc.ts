import { config } from '../utils/ValidatedConfig'
import { CoinValuesProps, IndicationType } from './Interfaces'

const ROCsum: number[] = []
let ATRDelayCheck: string[] = []

const getROC = (coinHistory: CoinValuesProps[], ROCrate: number): number => {
	const currentValue = coinHistory[0].close
	const pastValue = coinHistory[ROCrate].close
	const ROC = ((currentValue - pastValue) / pastValue) * 100
	return ROC
}

const getWMA = (ROCsum: number[], WMArate: number): number => {
	let weightedValuesSum = 0
	let totalWeight = 0
	for (let weight = 1; weight < WMArate + 1; weight++) {
		const WMA = ROCsum[WMArate - weight] * weight
		totalWeight += weight
		weightedValuesSum += WMA
	}
	return weightedValuesSum / totalWeight
}

export const runCoppockAlgorithm = (
	coinHistory: CoinValuesProps[]
): number | void => {
	if (coinHistory.length >= config.minInitialValues) {
		// Calculate sum of shortName ROC and long ROC
		const short = getROC(coinHistory, config.shortROC)
		const long = getROC(coinHistory, config.longROC)
		const sum = short + long
		ROCsum.unshift(sum)
	}
	if (coinHistory.length >= config.minAlgorithmValues) {
		// Calculate WMA of shortName ROC and long ROC
		const currentWMA = getWMA(ROCsum, config.WMA)
		return currentWMA
	}
}

export const runATRAlgorithm = (coinHistory: CoinValuesProps[]): number => {
	const TRValues: number[] = []
	for (let i = 1; i < config.WMA + 1; i++) {
		const TR: number[] = []
		TR.push(coinHistory[i].high - coinHistory[i].low)
		TR.push(coinHistory[i + 1].close - coinHistory[i].low)
		TR.push(coinHistory[i].high - coinHistory[i + 1].close)
		TRValues.push(Math.max(...TR))
	}
	const ATR = getWMA(TRValues, config.WMA)
	return ATR
}

export const analyzeCoppock = (coppockValues: number[]): IndicationType => {
	// Analize if previous N values were above or below 0
	// If current value is above 0 and previous N(buyBuffer) values were below = BUY

	const valuesToCompare = coppockValues.slice(0, config.buyBuffer + 1)
	if (valuesToCompare.length < config.buyBuffer + 1) {
		const tempArr = Array.from({ length: config.buyBuffer + 1 }, () => 0)
		valuesToCompare.push(...tempArr)
	}
	const isValueIndicatingBuy = valuesToCompare[0] > 0
	let isIndicationValid = false

	for (let i = 1; i < valuesToCompare.length; i++) {
		if (isValueIndicatingBuy) {
			if (valuesToCompare[i] < 0) {
				isIndicationValid = true
			} else {
				isIndicationValid = false
				break
			}
		} else {
			isIndicationValid = false
			break
		}
	}

	if (isIndicationValid) {
		return IndicationType.BUY
	}
	return IndicationType.HODL
}

export const analyzeATR = (
	buyId: string,
	currentBuy: {
		time: string
		buyPrice: number
		buyAmount: number
		averagePrice: number
		atr: number
	},
	closePrice: number
): IndicationType => {
	const atrDelay = ATRDelayCheck.filter((atr) => atr === buyId)
	// Analize if previous ATR is reach, if so SELL
	if (
		closePrice >=
		currentBuy.buyPrice / currentBuy.buyAmount +
			currentBuy.atr * config.ATRmultiplier
	) {
		return IndicationType.SELL
	} else if (
		closePrice >=
		currentBuy.buyPrice / currentBuy.buyAmount + currentBuy.atr
	) {
		if (atrDelay.length === config.sellBuffer) {
			return IndicationType.SELL
		} else {
			// Add to delay
			ATRDelayCheck.push(buyId)
			return IndicationType.HODL
		}
	}
	// Zero delay
	ATRDelayCheck = ATRDelayCheck.filter((atr) => atr !== buyId)
	return IndicationType.HODL
}
