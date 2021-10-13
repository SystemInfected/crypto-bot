import { logInfo, logCoinValue, clearLog, logHeader } from './Logger'

export const displayLoadingHeader = (startTime: string): void => {
	clearLog()
	logHeader(startTime)
	logInfo('\nCollecting crypto data...\nRunning algorithm...')
}

export const displayCurrentValueHeader = (
	startTime: string,
	dateFormatted: string,
	averagePrice: number
): void => {
	clearLog()
	logHeader(startTime)
	logCoinValue(dateFormatted, averagePrice)
}
