import { config } from '../utils/ValidatedConfig'
import { IndicationType } from './Interfaces'

const ROCsum: number[] = []
let ATRDelayCheck: string[] = []

const getROC = (coinValueFromStableCoin: number[], ROCrate: number): number => {
	const currentValue = coinValueFromStableCoin[0]
	const pastValue = coinValueFromStableCoin[ROCrate]
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
	coinValueFromStableCoin: number[]
): number | void => {
	if (coinValueFromStableCoin.length >= config.minInitialValues) {
		// Calculate sum of short ROC and long ROC
		const short = getROC(coinValueFromStableCoin, config.shortROC)
		const long = getROC(coinValueFromStableCoin, config.longROC)
		const sum = short + long
		ROCsum.unshift(sum)
	}
	if (coinValueFromStableCoin.length >= config.minAlgorithmValues) {
		// Calculate WMA of short ROC and long ROC
		const currentWMA = getWMA(ROCsum, config.WMA)
		return currentWMA
	}
}

export const runATRAlgorithm = (coinValueFromStableCoin: number[]): number => {
	const TRValues: number[] = []
	for (let i = 1; i < config.WMA + 1; i++) {
		if (coinValueFromStableCoin[i] > coinValueFromStableCoin[i + 1]) {
			const TR = coinValueFromStableCoin[i] - coinValueFromStableCoin[i + 1]
			TRValues.push(TR)
		} else {
			const TR = coinValueFromStableCoin[i + 1] - coinValueFromStableCoin[i]
			TRValues.push(TR)
		}
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
	currentBuy: { time: string; price: number; atr: number },
	marketPrice: number
): IndicationType => {
	const atrDelay = ATRDelayCheck.filter((atr) => atr === buyId)
	// Analize if previous ATR is reach, if so SELL
	if (marketPrice >= currentBuy.price + currentBuy.atr * config.ATRmultiplier) {
		return IndicationType.SELL
	} else if (marketPrice >= currentBuy.price + currentBuy.atr) {
		if (atrDelay.length === config.sellBuffer) {
			return IndicationType.SELL
		} else {
			// Add to delay
			ATRDelayCheck.push(buyId)
		}
	}
	// Zero delay
	ATRDelayCheck = ATRDelayCheck.filter((atr) => atr !== buyId)
	return IndicationType.HODL
}
