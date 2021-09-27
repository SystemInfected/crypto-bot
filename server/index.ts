import express from 'express'
import cors from 'cors'
import { getPrice, getPriceDetails, ping } from './components/CryptoData'
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
let readyToBuy = true

const buySellIndication: {
	time: string
	config: GlobalConfig
	status: IndicationType
	price: number
	result: number
}[] = []

const tick = async (): Promise<void> => {
	const priceData = await getPrice(
		`${globalConfig.coin.coingeckoId},${globalConfig.stableCoin.coingeckoId}`,
		'usd'
	)
	try {
		const marketPrice =
			priceData[globalConfig.coin.coingeckoId].usd /
			priceData[globalConfig.stableCoin.coingeckoId].usd
		const dateObject = new Date(
			priceData[globalConfig.coin.coingeckoId].last_updated_at * 1000
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

			if (readyToBuy) {
				try {
					const priceDetails = await getPriceDetails(
						globalConfig.coin.coingeckoId
					)
					const { market_data: marketData } = priceDetails
					if (marketData?.low_24h && marketData?.high_24h) {
						const maxBuyPrice =
							marketData.low_24h.usd +
							(marketData.high_24h.usd - marketData.low_24h.usd) *
								globalConfig.falsePositiveBuffer

						if (marketPrice < maxBuyPrice) {
							const analyzeBuyResult = analyzeCoppock(
								coppockValues,
								globalConfig
							)
							switch (analyzeBuyResult) {
								case IndicationType.BUY: {
									const atrValue = runATRAlgorithm(
										coinValueFromStableCoin,
										globalConfig
									)
									buySellIndication.push({
										time: dateFormatted,
										config: globalConfig,
										status: IndicationType.BUY,
										price: marketPrice,
										result: atrValue,
									})
									atrValues.unshift({ atr: atrValue, price: marketPrice })
									readyToBuy = false
									break
								}
								case IndicationType.HODL:
									break
								default:
									break
							}
						}
					}
				} catch (error) {
					logError(error)
				}
			} else if (!readyToBuy) {
				logCurrentATRValue(globalConfig, atrValues[0].atr)
				const analyzeSellResult = analyzeATR(
					atrValues[0],
					marketPrice,
					globalConfig
				)
				switch (analyzeSellResult) {
					case IndicationType.SELL: {
						buySellIndication.push({
							time: dateFormatted,
							config: globalConfig,
							status: IndicationType.SELL,
							price: marketPrice,
							result: marketPrice - atrValues[0].price,
						})
						readyToBuy = true
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
	} catch (error) {
		logError(error)
	}
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

// Express server for frontend
const app = express()
const port = 4000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())

app.listen(port)

app.get('/express_backend', (req, res) => {
	res.send({ express: 'YOUR EXPRESS BACKEND IS CONNECTED TO REACT' })
})
