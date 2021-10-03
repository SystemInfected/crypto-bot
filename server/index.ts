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

interface StartupDataProps {
	time: string
}

interface EvaluateBuyProps {
	marketPrice: number
	dateFormatted: string
}

interface EvaluateSellProps {
	marketPrice: number
	dateFormatted: string
}

const startupData: StartupDataProps = { time: '' }
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

const evaluateBuy = async ({
	marketPrice,
	dateFormatted,
}: EvaluateBuyProps): Promise<void> => {
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
						if (Object.keys(currentBuys).length === config.concurrentOrders) {
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
}

const evaluateSell = ({
	marketPrice,
	dateFormatted,
}: EvaluateSellProps): void => {
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

		if (readyToBuy) {
			await evaluateBuy({ marketPrice, dateFormatted })
		} else if (!readyToBuy) {
			evaluateSell({ marketPrice, dateFormatted })
		}

		logCurrentCoppockValue(coppockValues[0] || 0)

		logCurrentBuys(currentBuys)
		logBuySellIndication(buySellIndication)
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
