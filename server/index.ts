import express from 'express'
import cors from 'cors'
import path from 'path'
import {
	createBuyOrder,
	createSellOrder,
	getBalance,
	getPrice,
	get12hPriceDetails,
	getPriceHistory,
	ping,
} from './components/CryptoData'
import {
	displayCurrentValueHeader,
	displayLoadingHeader,
} from './utils/Messenger'
import { config } from './utils/ValidatedConfig'
import {
	clearLog,
	logBalance,
	logBuySellHistory,
	logCurrentBuys,
	logCurrentCoppockValue,
	logError,
	logInfo,
	logStatus,
} from './utils/Logger'
import {
	CoinValuesProps,
	CurrentBuy,
	IndicationType,
} from './components/Interfaces'
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
const coinHistory: Array<CoinValuesProps> = []
const priceChartData: Array<{ time: string; price: CoinValuesProps }> = []
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
	buyAmount: number
	buyCost: number
	averagePrice: number
	result?: number
}[] = []

let currentStatus: string

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
	const coinHistoryData = await getPriceHistory()
	coinHistoryData.forEach((history, index) => {
		const averagePrice = (history[1] + history[2] + history[3] + history[4]) / 4
		const dateObject = new Date(history[0])
		const timeFormatted = dateObject.toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		})

		const coinValue: CoinValuesProps = {
			timestamp: history[0],
			open: history[1],
			high: history[2],
			low: history[3],
			close: history[4],
			volume: history[5],
			average: averagePrice,
		}
		coinHistory.unshift(coinValue)
		priceChartData.push({ time: timeFormatted, price: coinValue })

		if (index >= config.minInitialValues) {
			const coppockValue = runCoppockAlgorithm(coinHistory)
			if (typeof coppockValue === 'number') {
				coppockValues.unshift(coppockValue)
				coppockChartData.push({ time: timeFormatted, coppockValue })
			}
		}
	})
}

const tick = async (): Promise<void> => {
	currentStatus = 'Waiting for indication to buy'
	const priceData = await getPrice()
	try {
		displayLoadingHeader(startupData.time)

		const averagePrice =
			(priceData.open + priceData.high + priceData.low + priceData.close) / 4
		const currentPrice: CoinValuesProps = {
			timestamp: priceData.timestamp,
			open: priceData.open,
			high: priceData.high,
			low: priceData.low,
			close: priceData.close,
			volume: priceData.volume,
			average: averagePrice,
		}
		const priceDateObject = new Date(currentPrice.timestamp)
		const priceTimeFormatted = priceDateObject.toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		})
		coinHistory.unshift(currentPrice)
		priceChartData.push({ time: priceTimeFormatted, price: currentPrice })

		const balance = await getBalance()
		const currentBalance = balance.currentCoin

		const buyAmount = (currentBalance * config.allocation) / averagePrice

		const dateObject = new Date()
		const dateFormatted = dateObject.toLocaleString()
		const timeFormatted = dateObject.toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		})

		const coppockValue = runCoppockAlgorithm(coinHistory)
		if (typeof coppockValue === 'number') {
			coppockValues.unshift(coppockValue)
			coppockChartData.push({ time: timeFormatted, coppockValue })
		}

		if (Object.keys(currentBuys).length < config.concurrentOrders) {
			const priceDetails = await get12hPriceDetails()
			try {
				const maxBuyPrice =
					priceDetails.open +
					(priceDetails.close - priceDetails.open) * config.falsePositiveBuffer

				if (averagePrice < maxBuyPrice) {
					const analyzeBuyResult = analyzeCoppock(coppockValues)
					switch (analyzeBuyResult) {
						case IndicationType.BUY: {
							const buyOrder = await createBuyOrder(buyAmount)
							try {
								if (buyOrder.status === 'closed') {
									const buyId = `${config.coin.shortName}${Date.now()}`
									const atrValue = runATRAlgorithm(coinHistory)
									buySellIndication.unshift({
										time: dateFormatted,
										status: IndicationType.BUY,
										buyAmount: buyOrder.amount,
										buyCost: buyOrder.cost,
										averagePrice: averagePrice,
									})
									atrValues.unshift({ atr: atrValue, price: averagePrice })
									currentBuys[buyId] = {
										time: dateFormatted,
										buyPrice: buyOrder.cost,
										buyAmount: buyOrder.amount,
										averagePrice: averagePrice,
										atr: atrValue,
									}
								} else if (buyOrder.status === 'canceled') {
									currentStatus =
										'Buy order got canceled, waiting for new indication to buy'
								}
							} catch (error) {
								logError(`Create buy order error:  ${error}`)
							}
							break
						}
						case IndicationType.HODL:
							break
						default:
							break
					}
				} else {
					currentStatus = `Market price is above the buy limit (${maxBuyPrice} ${config.stableCoin.shortName})`
				}
			} catch (error) {
				logError(`Get price details error:  ${error}`)
			}
		} else {
			currentStatus = `Concurrent orders limit(${config.concurrentOrders}) is reached`
		}
		if (Object.keys(currentBuys).length > 0) {
			for (const key in currentBuys) {
				const currentBuy = currentBuys[key]
				const analyzeSellResult = analyzeATR(
					key,
					currentBuy,
					currentPrice.close
				)
				switch (analyzeSellResult) {
					case IndicationType.SELL: {
						const sellOrder = await createSellOrder(currentBuy.buyAmount)
						try {
							if (sellOrder.status === 'closed') {
								buySellIndication.unshift({
									time: dateFormatted,
									status: IndicationType.SELL,
									buyAmount: sellOrder.amount,
									buyCost: sellOrder.cost,
									averagePrice: averagePrice,
									result: sellOrder.cost - currentBuy.buyPrice,
								})
								delete currentBuys[key]
							} else if (sellOrder.status === 'canceled') {
								currentStatus =
									'Sell order got canceled, waiting for new indication to sell'
							}
						} catch (error) {
							logError(`Create sell order error:  ${error}`)
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

		const newBalance = await getBalance()

		displayCurrentValueHeader(
			startupData.time,
			dateFormatted,
			coinHistory[0].average
		)
		logCurrentCoppockValue(coppockValues[0] || 0)
		logStatus(currentStatus)
		logBalance(newBalance.total)
		logCurrentBuys(currentBuys)
		logBuySellHistory(buySellIndication)
	} catch (error) {
		logError(`Get price error:  ${error}`)
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
		.catch((error) => {
			logError(`Initial load error:  ${error}`)
		})
}

clearLog()
logInfo('Connecting to crypto server...')

/* ping()
	.then((data) => {
		if (data === 'ok') {
			logInfo(`Exchange status: ${data}`)
			run()
		} else {
			logError(`Exchange status: ${data}`)
		}
	})
	.catch((error) => logError(`Connect to exchange error:  ${error}`)) */
const pingStatus = ping()
if (pingStatus === 'ok') {
	logInfo(`Exchange status: ${pingStatus}`)
	run()
}

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
