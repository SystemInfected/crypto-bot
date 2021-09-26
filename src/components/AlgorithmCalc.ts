import { GlobalConfig, IndicationType } from './Interfaces'

const ROCsum: number[] = []

const getROC = (ethereumTether: number[], ROCrate: number): number => {
	const currentValue = ethereumTether[0]
	const pastValue = ethereumTether[ROCrate]
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
	ethereumTether: number[],
	globalConfig: GlobalConfig
): number | void => {
	if (ethereumTether.length >= globalConfig.minInitialValues) {
		// Calculate sum of short ROC and long ROC
		const short = getROC(ethereumTether, globalConfig.shortROC)
		const long = getROC(ethereumTether, globalConfig.longROC)
		const sum = short + long
		ROCsum.unshift(sum)
	}
	if (ethereumTether.length >= globalConfig.minAlgorithmValues) {
		// Calculate WMA of short ROC and long ROC
		const currentWMA = getWMA(ROCsum, globalConfig.WMA)
		return currentWMA
	}
}

export const runATRAlgorithm = (
	ethereumTether: number[],
	globalConfig: GlobalConfig
): number => {
	const TRValues: number[] = []
	for (let i = 1; i < globalConfig.WMA + 1; i++) {
		if (ethereumTether[i] > ethereumTether[i + 1]) {
			const TR = ethereumTether[i] - ethereumTether[i + 1]
			TRValues.push(TR)
		} else {
			const TR = ethereumTether[i + 1] - ethereumTether[i]
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
	// If current value is above 0 and previous N(buySellBuffer) values were below = BUY

	const valuesToCompare = coppockValues.slice(0, globalConfig.buySellBuffer + 1)
	if (valuesToCompare.length < globalConfig.buySellBuffer + 1) {
		const tempArr = Array.from(
			{ length: globalConfig.buySellBuffer + 1 },
			() => 0
		)
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
