import { config } from './ValidatedConfig'
import { logInfo, logCoinValue, clearLog, logHeader } from './Logger'

export const displayCurrentValueMessage = (
	startTime: string,
	marketPrice: number,
	dateFormatted: string,
	coinValueFromStableCoin: number[]
): void => {
	if (coinValueFromStableCoin.length < config.minAlgorithmValues) {
		if (coinValueFromStableCoin.length > 1) {
			clearLog()
		}
		logHeader(startTime)
		if (coinValueFromStableCoin.length < config.minInitialValues) {
			logInfo(
				`Firing up the engines!\nPlease allow ${(config.minInitialValues -
					coinValueFromStableCoin.length) *
					config.tickInterval} minute(s) to pass for the algorithm to collect enough data`
			)
		} else {
			logInfo(
				`Algorithm is starting up...\nPlease allow ${(config.minAlgorithmValues -
					coinValueFromStableCoin.length) *
					config.tickInterval} minute(s) more to pass for the algorithm to collect enough data`
			)
		}
	} else {
		clearLog()
		logHeader(startTime)
		logInfo('Algorithm is running!')
	}
	logCoinValue(dateFormatted, marketPrice)
}
