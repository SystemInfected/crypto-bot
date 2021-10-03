import express from 'express'
import cors from 'cors'
import path from 'path'
import { getPrice, getPriceDetails, ping } from './components/CryptoData'
import { displayCurrentValueMessage } from './utils/Messenger'
import { config } from './utils/ValidatedConfig'
import {
	clearLog,
	logBuySellIndication,
	logCurrentBuys,
	logCurrentCoppockValue,
	logError,
	logInfo,
} from './utils/Logger'
import { CurrentBuy, IndicationType } from './components/Interfaces'
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

const startupData: StartupData = { time: '' }
const coinValueFromStableCoin: number[] = []
const priceChartData: Array<{ time: string; price: number }> = []
const coppockValues: number[] = []
const coppockChartData: Array<{
	time: string
	coppockValue: number
}> = new Array(config.minAlgorithmValues - 1).fill({
	time: `${new Date().toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
	})}`,
	coppockValue: 0,
})
const atrValues: { atr: number; price: number }[] = []
let readyToBuy = true

const buySellIndication: {
	time: string
	status: IndicationType
	price: number
	result: number
}[] = []

const currentBuys: CurrentBuy = {}

// Express server for frontend
const app = express()
const port = 4000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())
app.use('/', express.static(path.join(__dirname, '../web/dist')))
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../web/dist/index.html'))
})

app.listen(port)

const tick = async (): Promise<void> => {
	const priceData = await getPrice(
		`${config.coin.coingeckoId.toLowerCase()},${config.stableCoin.coingeckoId.toLowerCase()}`,
		'usd'
	)
	try {
		const marketPrice =
			priceData[config.coin.coingeckoId.toLowerCase()].usd /
			priceData[config.stableCoin.coingeckoId.toLowerCase()].usd
		const dateObject = new Date(
			priceData[config.coin.coingeckoId.toLowerCase()].last_updated_at * 1000
		)
		const dateFormatted = dateObject.toLocaleString()
		const timeFormatted = dateObject.toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		})
		coinValueFromStableCoin.unshift(marketPrice)
		priceChartData.push({ time: timeFormatted, price: marketPrice })
		displayCurrentValueMessage(
			startupData.time,
			marketPrice,
			dateFormatted,
			coinValueFromStableCoin
		)
		if (coinValueFromStableCoin.length >= config.minInitialValues) {
			const dateObject = new Date()
			const dateFormatted = dateObject.toLocaleString()
			const timeFormatted = dateObject.toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
			})

			const coppockValue = runCoppockAlgorithm(coinValueFromStableCoin)
			if (typeof coppockValue === 'number') {
				coppockValues.unshift(coppockValue)
				coppockChartData.push({ time: timeFormatted, coppockValue })
			}

			if (readyToBuy) {
				try {
					const priceDetails = await getPriceDetails(
						config.coin.coingeckoId.toLowerCase()
					)
					const { market_data: marketData } = priceDetails
					if (marketData?.low_24h && marketData?.high_24h) {
						const maxBuyPrice =
							marketData.low_24h.usd +
							(marketData.high_24h.usd - marketData.low_24h.usd) *
								config.falsePositiveBuffer

						if (marketPrice < maxBuyPrice) {
							const analyzeBuyResult = analyzeCoppock(coppockValues)
							switch (analyzeBuyResult) {
								case IndicationType.BUY: {
									const buyId = `${config.coin.short}${Date.now()}`
									const atrValue = runATRAlgorithm(coinValueFromStableCoin)
									buySellIndication.unshift({
										time: dateFormatted,
										status: IndicationType.BUY,
										price: marketPrice,
										result: atrValue,
									})
									atrValues.unshift({ atr: atrValue, price: marketPrice })
									currentBuys[buyId] = {
										time: dateFormatted,
										price: marketPrice,
										atr: atrValue,
									}
									if (
										Object.keys(currentBuys).length === config.concurrentOrders
									) {
										readyToBuy = false
									}
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
				const analyzeSellResult = analyzeATR(atrValues[0], marketPrice)
				switch (analyzeSellResult) {
					case IndicationType.SELL: {
						buySellIndication.push({
							time: dateFormatted,
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
		}
		if (coinValueFromStableCoin.length >= config.minAlgorithmValues) {
			logCurrentBuys(currentBuys)
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
	setInterval(tick, config.tickInterval * 1000 * 60)
}

clearLog()
logInfo('Connecting to crypto server...')
ping()
	.then((data) => {
		logInfo(data.gecko_says)
		run()
	})
	.catch((err) => logError(err))

app.get('/chart_data', async (req, res) => {
	res.send({
		configData: {
			coin: config.coin.coingeckoId,
			stableCoin: config.stableCoin.coingeckoId,
			minInitialValues: config.minInitialValues,
		},
		priceChartData,
		coppockChartData,
	})
})
