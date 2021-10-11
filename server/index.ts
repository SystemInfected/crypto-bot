import express from 'express'
import cors from 'cors'
import path from 'path'
import {
	getPrice,
	getPriceDetails,
	getPriceHistory,
	ping,
} from './components/CryptoData'
import { displayCurrentValueHeader } from './utils/Messenger'
import { config } from './utils/ValidatedConfig'
import {
	clearLog,
	logBuySellHistory,
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

interface StartupDataProps {
	time: string
}

const startupData: StartupDataProps = { time: '' }
const coinValueFromStableCoin: number[] = []
const priceChartData: Array<{ time: string; price: number }> = []
const coppockValues: number[] = []
const coppockChartData: Array<{
	time: string
	coppockValue: number
}> = new Array(config.minAlgorithmValues - 1).fill({
	time: 'xx:xx',
	coppockValue: 0,
})
const atrValues: { atr: number; price: number }[] = []

const buySellIndication: {
	time: string
	status: IndicationType
	price: number
	result: number
}[] = []

const currentBuys: CurrentBuy = {}

// Express server for frontend
const app = express()
const port = process.env.PORT

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())
app.use('/', express.static(path.join(__dirname, '../web/dist')))
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../web/dist/index.html'))
})

app.listen(port)

const initialLoad = async (): Promise<void> => {
	const coinHistory = await getPriceHistory()
	coinHistory.prices.forEach((history, index) => {
		const marketPrice = history[1]
		const dateObject = new Date(history[0])
		const timeFormatted = dateObject.toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		})

		coinValueFromStableCoin.unshift(marketPrice)
		priceChartData.push({ time: timeFormatted, price: marketPrice })

		if (index >= config.minInitialValues) {
			const coppockValue = runCoppockAlgorithm(coinValueFromStableCoin)
			if (typeof coppockValue === 'number') {
				coppockValues.unshift(coppockValue)
				coppockChartData.push({ time: timeFormatted, coppockValue })
			}
		}
	})
}

const tick = async (): Promise<void> => {
	const priceData = await getPrice()
	try {
		const marketPrice =
			priceData[config.coin.fullName.toLowerCase()].usd /
			priceData[config.stableCoin.fullName.toLowerCase()].usd
		const priceDateObject = new Date(
			priceData[config.coin.fullName.toLowerCase()].last_updated_at * 1000
		)
		const priceDateFormatted = priceDateObject.toLocaleString()
		const priceTimeFormatted = priceDateObject.toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		})
		coinValueFromStableCoin.unshift(marketPrice)
		priceChartData.push({ time: priceTimeFormatted, price: marketPrice })
		displayCurrentValueHeader(
			startupData.time,
			marketPrice,
			priceDateFormatted,
			coinValueFromStableCoin
		)

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

		if (Object.keys(currentBuys).length < config.concurrentOrders) {
			try {
				const priceDetails = await getPriceDetails()
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
		}
		if (Object.keys(currentBuys).length > 0) {
			for (const key in currentBuys) {
				const currentBuy = currentBuys[key]
				const analyzeSellResult = analyzeATR(key, currentBuy, marketPrice)
				switch (analyzeSellResult) {
					case IndicationType.SELL: {
						buySellIndication.unshift({
							time: dateFormatted,
							status: IndicationType.SELL,
							price: marketPrice,
							result: marketPrice - currentBuy.price,
						})
						delete currentBuys[key]
						break
					}
					case IndicationType.HODL:
						break
					default:
						break
				}
			}
		}

		logCurrentCoppockValue(coppockValues[0] || 0)

		logCurrentBuys(currentBuys)
		logBuySellHistory(buySellIndication)
	} catch (error) {
		logError(error)
	}
}

const run = (): void => {
	const dateObject = new Date()
	const dateFormatted = dateObject.toLocaleString()
	startupData.time = dateFormatted
	initialLoad()
		.then(() => {
			tick()
			setInterval(tick, config.tickInterval * 1000 * 60)
		})
		.catch((err) => {
			logError(err)
		})
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
			coin: config.coin.fullName,
			stableCoin: config.stableCoin.fullName,
			minInitialValues: config.minInitialValues,
		},
		priceChartData,
		coppockChartData,
	})
})
