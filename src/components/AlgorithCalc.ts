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
		const WMA = ROCsum[weight - 1] * weight
		totalWeight += weight
		weightedValuesSum += WMA
	}
	return weightedValuesSum / totalWeight
}

export const runAlgorithm = (
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

export const analyzeCoppock = (
	coppockValues: number[],
	globalConfig: GlobalConfig
): IndicationType => {
	// Analize if previous N values were above or below 0
	// If current value is above 0 and previous N values were below = BUY
	// If current value is below 0 and previous N values were above = SELL

	const valuesToCompare = coppockValues.slice(0, globalConfig.buySellBuffer + 1)
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
			if (valuesToCompare[i] > 0) {
				isIndicationValid = true
			} else {
				isIndicationValid = false
				break
			}
		}
	}

	if (isIndicationValid) {
		if (isValueIndicatingBuy) {
			return IndicationType.BUY
		}
		return IndicationType.SELL
	}
	return IndicationType.STAY
}
