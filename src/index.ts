import { getPrice, ping } from './components/CryptoData'
import { displayCurrentValueMessage } from './utils/Messenger'
import {
	clearLog,
	logBuySellIndication,
	logCurrentCoppockValue,
	logError,
	logInfo,
} from './utils/Logger'
import { GlobalConfig, IndicationType } from './components/Interfaces'
import { analyzeCoppock, runAlgorithm } from './components/AlgorithCalc'
require('dotenv').config()

const globalConfig: GlobalConfig = {
	tickInterval: 0.02,
	minInitialValues: 15,
	minAlgorithmValues: 25,
	longROC: 14,
	shortROC: 11,
	WMA: 10,
	buySellBuffer: 4,
}

const ethereumTether: number[] = []
const coppockValues: number[] = []
const buySellIndication: Map<string, [number, string]> = new Map()

const tick = async (): Promise<void> => {
	await getPrice('ethereum,tether', 'usd')
		.then((response) => {
			const precision = 100 // 2 decimals
			const randomnum =
				Math.floor(
					Math.random() * (1.1 * precision - 0.95 * precision) +
						0.95 * precision
				) /
				(1 * precision)
			const marketPrice =
				(response.ethereum.usd / response.tether.usd) * randomnum
			const dateObject = new Date(response.ethereum.last_updated_at * 1000)
			const dateFormatted = dateObject.toLocaleString()
			ethereumTether.unshift(marketPrice)
			displayCurrentValueMessage(
				marketPrice,
				dateFormatted,
				ethereumTether,
				globalConfig
			)
			if (ethereumTether.length >= globalConfig.minInitialValues) {
				const coppockValue = runAlgorithm(ethereumTether, globalConfig)
				if (typeof coppockValue === 'number') {
					coppockValues.unshift(coppockValue)
				}
				const analyzeResult = analyzeCoppock(coppockValues, globalConfig)
				const dateObject = new Date()
				const dateFormatted = dateObject.toLocaleString()
				switch (analyzeResult) {
					case IndicationType.BUY:
						buySellIndication.set('BUY', [marketPrice, dateFormatted])
						break
					case IndicationType.SELL:
						buySellIndication.set('SELL', [marketPrice, dateFormatted])
						break
					case IndicationType.HODL:
						break
					default:
						break
				}

				logCurrentCoppockValue(coppockValues[0] || 0)
				logBuySellIndication(buySellIndication)
			}
		})
		.catch((err) => logError(err))
}

const run = (): void => {
	tick()
	setInterval(tick, globalConfig.tickInterval * 1000 * 60)
}

clearLog()
logInfo('Connecting to crypto server...')
ping()
	.then((data) => {
		logInfo(data.gecko_says)
		run()
	})
	.catch((err) => logError(err))
