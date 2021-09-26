import { GlobalConfig, IndicationType } from './Interfaces'

const ROCsum: number[] = []

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
	coinValueFromStableCoin: number[],
	globalConfig: GlobalConfig
): number | void => {
	if (coinValueFromStableCoin.length >= globalConfig.minInitialValues) {
		// Calculate sum of short ROC and long ROC
		const short = getROC(coinValueFromStableCoin, globalConfig.shortROC)
		const long = getROC(coinValueFromStableCoin, globalConfig.longROC)
		const sum = short + long
		ROCsum.unshift(sum)
	}
	if (coinValueFromStableCoin.length >= globalConfig.minAlgorithmValues) {
		// Calculate WMA of short ROC and long ROC
		const currentWMA = getWMA(ROCsum, globalConfig.WMA)
		return currentWMA
	}
}

export const runATRAlgorithm = (
	coinValueFromStableCoin: number[],
	globalConfig: GlobalConfig
): number => {
	const TRValues: number[] = []
	for (let i = 1; i < globalConfig.WMA + 1; i++) {
		if (coinValueFromStableCoin[i] > coinValueFromStableCoin[i + 1]) {
			const TR = coinValueFromStableCoin[i] - coinValueFromStableCoin[i + 1]
			TRValues.push(TR)
		} else {
			const TR = coinValueFromStableCoin[i + 1] - coinValueFromStableCoin[i]
			TRValues.push(TR)
		}
	}
	const ATR = getWMA(TRValues, globalConfig.WMA)
	return ATR
}

// Only BUY if status is SELL or HOLD and only SELL if status is BUY
let currentBuySellStatus: IndicationType = IndicationType.HODL

export const analyzeCoppock = (
	coppockValues: number[],
	globalConfig: GlobalConfig
): IndicationType => {
	// Analize if previous N values were above or below 0
	// If current value is above 0 and previous N(buyBuffer) values were below = BUY

	const valuesToCompare = coppockValues.slice(0, globalConfig.buyBuffer + 1)
	if (valuesToCompare.length < globalConfig.buyBuffer + 1) {
		const tempArr = Array.from({ length: globalConfig.buyBuffer + 1 }, () => 0)
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
		if (isValueIndicatingBuy && currentBuySellStatus !== IndicationType.BUY) {
			currentBuySellStatus = IndicationType.BUY
			return IndicationType.BUY
		}
	}
	return IndicationType.HODL
}

export const analyzeATR = (
	atrValues: { atr: number; price: number },
	marketPrice: number
): IndicationType => {
	// Analize if previous ATR is reach, if so SELL

	const { atr, price } = atrValues

	if (marketPrice >= price + atr) {
		return IndicationType.SELL
	}
	return IndicationType.HODL
}
