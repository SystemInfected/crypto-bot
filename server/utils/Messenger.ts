import { logInfo, logCoinValue, clearLog, logHeader } from './Logger'

export const displayCurrentValueHeader = (
	startTime: string,
	marketPrice: number,
	dateFormatted: string,
	coinValueFromStableCoin: number[]
): void => {
	clearLog()
	logHeader(startTime)
	logInfo('Algorithm is running!')
	logCoinValue(dateFormatted, coinValueFromStableCoin[0])
}
