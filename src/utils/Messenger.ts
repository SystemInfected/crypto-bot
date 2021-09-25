import { GlobalConfig } from '../components/Interfaces'
import { logInfo, logCoinValue, clearLog } from './Logger'

export const displayCurrentValueMessage = (
	marketPrice: number,
	dateFormatted: string,
	ethereumTether: number[],
	globalConfig: GlobalConfig
): void => {
	if (ethereumTether.length < globalConfig.minAlgorithmValues) {
		if (ethereumTether.length > 1) {
			clearLog()
		}
		if (ethereumTether.length < globalConfig.minInitialValues) {
			logInfo(
				`Firing up the engines!\nPlease allow ${(globalConfig.minInitialValues -
					ethereumTether.length) *
					globalConfig.tickInterval} minute(s) to pass for the algorithm to collect enough data`
			)
		} else {
			logInfo(
				`Algorithm is starting up...\nPlease allow ${(globalConfig.minAlgorithmValues -
					ethereumTether.length) *
					globalConfig.tickInterval} minute(s) more to pass for the algorithm to collect enough data`
			)
		}
	} else {
		clearLog()
		logInfo('Algorithm is running!')
	}
	logCoinValue(dateFormatted, marketPrice)
}
