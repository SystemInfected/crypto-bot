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
import {
	analyzeATR,
	analyzeCoppock,
	runATRAlgorithm,
	runCoppockAlgorithm,
} from './components/AlgorithmCalc'
require('dotenv').config()

interface StartupData {
	time: string
}

const globalConfig: GlobalConfig = {
	tickInterval: 3,
	minInitialValues: 15,
	minAlgorithmValues: 25,
	longROC: 14,
	shortROC: 11,
	WMA: 10,
	buySellBuffer: 4,
}

const startupData: StartupData = { time: '' }
const ethereumTether: number[] = []
const coppockValues: number[] = []
const atrValues: { atr: number; price: number }[] = []
let currentBuySellStatus: IndicationType = IndicationType.HODL

const buySellIndication: Map<string, [number, number, string]> = new Map()

const tick = async (): Promise<void> => {
	await getPrice('ethereum,tether', 'usd')
		.then((response) => {
			const marketPrice = response.ethereum.usd / response.tether.usd
			const dateObject = new Date(response.ethereum.last_updated_at * 1000)
			const dateFormatted = dateObject.toLocaleString()
			ethereumTether.unshift(marketPrice)
			displayCurrentValueMessage(
				startupData.time,
				marketPrice,
				dateFormatted,
				ethereumTether,
				globalConfig
			)
			if (ethereumTether.length >= globalConfig.minInitialValues) {
				const dateObject = new Date()
				const dateFormatted = dateObject.toLocaleString()

				const coppockValue = runCoppockAlgorithm(ethereumTether, globalConfig)
				if (typeof coppockValue === 'number') {
					coppockValues.unshift(coppockValue)
				}

				if (currentBuySellStatus !== IndicationType.BUY) {
					const analyzeBuyResult = analyzeCoppock(coppockValues, globalConfig)
					switch (analyzeBuyResult) {
						case IndicationType.BUY: {
							const atrValue = runATRAlgorithm(ethereumTether, globalConfig)
							buySellIndication.set('BUY', [
								marketPrice,
								atrValue,
								dateFormatted,
							])
							atrValues.unshift({ atr: atrValue, price: marketPrice })
							currentBuySellStatus = IndicationType.BUY
							break
						}
						case IndicationType.HODL:
							break
						default:
							break
					}
				} else if (currentBuySellStatus === IndicationType.BUY) {
					const analyzeSellResult = analyzeATR(atrValues[0], marketPrice)
					switch (analyzeSellResult) {
						case IndicationType.SELL: {
							buySellIndication.set('SELL', [
								marketPrice,
								marketPrice - atrValues[0].price,
								dateFormatted,
							])
							currentBuySellStatus = IndicationType.SELL
							break
						}
						case IndicationType.HODL:
							break
						default:
							break
					}
				}

				logCurrentCoppockValue(coppockValues[0] || 0)
				logBuySellIndication(buySellIndication)
			}
		})
		.catch((err) => logError(err))
}

const run = (): void => {
	const dateObject = new Date()
	const dateFormatted = dateObject.toLocaleString()
	startupData.time = dateFormatted
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
