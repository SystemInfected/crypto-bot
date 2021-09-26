import { GlobalConfig } from '../components/Interfaces'
import { logInfo, logCoinValue, clearLog, logHeader } from './Logger'

export const displayCurrentValueMessage = (
	startTime: string,
	marketPrice: number,
	dateFormatted: string,
	coinValueFromStableCoin: number[],
	globalConfig: GlobalConfig
): void => {
	if (coinValueFromStableCoin.length < globalConfig.minAlgorithmValues) {
		if (coinValueFromStableCoin.length > 1) {
			clearLog()
		}
		logHeader(startTime)
		if (coinValueFromStableCoin.length < globalConfig.minInitialValues) {
			logInfo(
				`Firing up the engines!\nPlease allow ${(globalConfig.minInitialValues -
					coinValueFromStableCoin.length) *
					globalConfig.tickInterval} minute(s) to pass for the algorithm to collect enough data`
			)
		} else {
			logInfo(
				`Algorithm is starting up...\nPlease allow ${(globalConfig.minAlgorithmValues -
					coinValueFromStableCoin.length) *
					globalConfig.tickInterval} minute(s) more to pass for the algorithm to collect enough data`
			)
		}
	} else {
		clearLog()
		logHeader(startTime)
		logInfo('Algorithm is running!')
	}
	logCoinValue(globalConfig, dateFormatted, marketPrice)
}
