import express from 'express'
import cors from 'cors'
import path from 'path'
import ccxt, { Balance, Exchange } from 'ccxt'
import {
	getPrice,
	getPriceDetails,
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
	buyAmount: number
	buyCost: number
	marketPrice: number
	result?: number
}[] = []

let currentStatus: string

let exchangeBalance: Balance

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

const tick = async (exchange: Exchange): Promise<void> => {
	currentStatus = 'Waiting for indication to buy'
	const priceData = await getPrice()
	try {
		displayLoadingHeader(startupData.time)

		const marketPrice =
			priceData[config.coin.longName.toLowerCase()].usd /
			priceData[config.stableCoin.longName.toLowerCase()].usd
		const priceDateObject = new Date(
			priceData[config.coin.longName.toLowerCase()].last_updated_at * 1000
		)
		const priceDateFormatted = priceDateObject.toLocaleString()
		const priceTimeFormatted = priceDateObject.toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		})
		coinValueFromStableCoin.unshift(marketPrice)
		priceChartData.push({ time: priceTimeFormatted, price: marketPrice })

		const balance = await exchange.fetchBalance()
		try {
			exchangeBalance = balance.total
		} catch (error) {
			logError(error)
		}

		const currentBalance =
			exchangeBalance[config.stableCoin.shortName as keyof Balance]

		const buyAmount = (currentBalance * config.allocation) / marketPrice

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
								const buyOrder = await exchange.createMarketOrder(
									`${config.coin.shortName}/${config.stableCoin.shortName}`,
									'buy',
									buyAmount
								)
								try {
									if (buyOrder.status === 'closed') {
										const buyId = `${config.coin.shortName}${Date.now()}`
										const atrValue = runATRAlgorithm(coinValueFromStableCoin)
										buySellIndication.unshift({
											time: dateFormatted,
											status: IndicationType.BUY,
											buyAmount: buyOrder.amount,
											buyCost: buyOrder.cost,
											marketPrice: marketPrice,
										})
										atrValues.unshift({ atr: atrValue, price: marketPrice })
										currentBuys[buyId] = {
											time: dateFormatted,
											buyPrice: buyOrder.cost,
											buyAmount: buyOrder.amount,
											marketPrice: marketPrice,
											atr: atrValue,
										}
									} else if (buyOrder.status === 'canceled') {
										currentStatus =
											'Buy order got canceled, waiting for new indication to buy'
									}
								} catch (error) {
									logError(error)
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
				}
			} catch (error) {
				logError(error)
			}
		} else {
			currentStatus = `Concurrent orders limit(${config.concurrentOrders}) is reached`
		}
		if (Object.keys(currentBuys).length > 0) {
			for (const key in currentBuys) {
				const currentBuy = currentBuys[key]
				const analyzeSellResult = analyzeATR(key, currentBuy, marketPrice)
				switch (analyzeSellResult) {
					case IndicationType.SELL: {
						const sellOrder = await exchange.createMarketOrder(
							`${config.coin.shortName}/${config.stableCoin.shortName}`,
							'sell',
							currentBuy.buyAmount
						)
						try {
							if (sellOrder.status === 'closed') {
								buySellIndication.unshift({
									time: dateFormatted,
									status: IndicationType.SELL,
									buyAmount: sellOrder.amount,
									buyCost: sellOrder.cost,
									marketPrice: marketPrice,
									result: sellOrder.cost - currentBuy.buyPrice,
								})
								delete currentBuys[key]
							} else if (sellOrder.status === 'canceled') {
								currentStatus =
									'Sell order got canceled, waiting for new indication to sell'
							}
						} catch (error) {
							logError(error)
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

		const newBalance = await exchange.fetchBalance()
		try {
			exchangeBalance = newBalance.total
		} catch (error) {
			logError(error)
		}

		displayCurrentValueHeader(
			startupData.time,
			priceDateFormatted,
			coinValueFromStableCoin
		)
		logCurrentCoppockValue(coppockValues[0] || 0)
		logStatus(currentStatus)
		logBalance(exchangeBalance)
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

	const exchangeClient = new ccxt.binance({
		apiKey: process.env.API_TEST_KEY,
		secret: process.env.API_TEST_SECRET,
	})
	exchangeClient.setSandboxMode(true)

	initialLoad()
		.then(() => {
			tick(exchangeClient)
			setInterval(tick, config.tickInterval * 1000 * 60, exchangeClient)
		})
		.catch((error) => {
			logError(error)
		})
}

clearLog()
logInfo('Connecting to crypto server...')
ping()
	.then((data) => {
		logInfo(data.gecko_says)
		run()
	})
	.catch((error) => logError(error))

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
