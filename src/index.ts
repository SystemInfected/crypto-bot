import { getPrice, ping } from './components/CryptoData'
import { displayCurrentValueMessage } from './utils/Messenger'
import {
	clearLog,
	logBuySellIndication,
	logCurrentATRValue,
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
import config from './data/config.json'
import configSchema from './data/schema.config.json'
require('dotenv').config()
import Ajv from 'ajv'
const ajv = new Ajv()

interface StartupData {
	time: string
}
const validate = ajv.compile<GlobalConfig>(configSchema)

const globalConfig: GlobalConfig = config

const startupData: StartupData = { time: '' }
const coinValueFromStableCoin: number[] = []
const coppockValues: number[] = []
const atrValues: { atr: number; price: number }[] = []
let currentBuySellStatus: IndicationType = IndicationType.HODL

const buySellIndication: Map<
	string,
	[GlobalConfig, IndicationType, number, number]
> = new Map()

const tick = async (): Promise<void> => {
	await getPrice(
		`${globalConfig.coin.coingeckoId},${globalConfig.stableCoin.coingeckoId}`,
		'usd'
	)
		.then((response) => {
			const marketPrice =
				response[globalConfig.coin.coingeckoId].usd /
				response[globalConfig.stableCoin.coingeckoId].usd
			const dateObject = new Date(
				response[globalConfig.coin.coingeckoId].last_updated_at * 1000
			)
			const dateFormatted = dateObject.toLocaleString()
			coinValueFromStableCoin.unshift(marketPrice)
			displayCurrentValueMessage(
				startupData.time,
				marketPrice,
				dateFormatted,
				coinValueFromStableCoin,
				globalConfig
			)
			if (coinValueFromStableCoin.length >= globalConfig.minInitialValues) {
				const dateObject = new Date()
				const dateFormatted = dateObject.toLocaleString()

				const coppockValue = runCoppockAlgorithm(
					coinValueFromStableCoin,
					globalConfig
				)
				if (typeof coppockValue === 'number') {
					coppockValues.unshift(coppockValue)
				}

				if (currentBuySellStatus !== IndicationType.BUY) {
					const analyzeBuyResult = analyzeCoppock(coppockValues, globalConfig)
					switch (analyzeBuyResult) {
						case IndicationType.BUY: {
							const atrValue = runATRAlgorithm(
								coinValueFromStableCoin,
								globalConfig
							)
							buySellIndication.set(dateFormatted, [
								globalConfig,
								IndicationType.BUY,
								marketPrice,
								atrValue,
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
					logCurrentATRValue(globalConfig, atrValues[0].atr)
					const analyzeSellResult = analyzeATR(atrValues[0], marketPrice)
					switch (analyzeSellResult) {
						case IndicationType.SELL: {
							buySellIndication.set(dateFormatted, [
								globalConfig,
								IndicationType.SELL,
								marketPrice,
								marketPrice - atrValues[0].price,
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
		if (validate(globalConfig)) {
			logInfo('Config is validated')
			run()
		} else {
			logError(validate.errors)
		}
	})
	.catch((err) => logError(err))
