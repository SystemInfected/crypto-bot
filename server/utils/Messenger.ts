import { CoinValuesProps } from '../components/Interfaces'
import {
	logInfo,
	logCoinValue,
	clearLog,
	logHeader,
	logDetails,
} from './Logger'

export const displayLoadingHeader = (startTime: string): void => {
	clearLog()
	logHeader(startTime)
	logInfo('\nCollecting crypto data...\nRunning algorithm...')
}

export const displayCurrentValueHeader = (
	startTime: string,
	dateFormatted: string,
	coinValue: CoinValuesProps
): void => {
	clearLog()
	logHeader(startTime)
	logCoinValue(dateFormatted, coinValue.average)
	logDetails(
		`Open: ${coinValue.open} High: ${coinValue.high} Low: ${coinValue.low} Close: ${coinValue.close}`
	)
}
