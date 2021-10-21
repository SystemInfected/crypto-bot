import express from 'express'
import cors from 'cors'
import path from 'path'
import { LocalStorage } from 'node-localstorage'
require('dotenv').config()

import {
	createBuyOrder,
	createSellOrder,
	getBalance,
	getPrice,
	getMaxBuyPrice,
	getPriceHistory,
	getOrderStatus,
} from './components/CryptoData'
import {
	BuySellHistoryProps,
	CoinValuesProps,
	CurrentBuy,
	IndicationType,
	OpenOrder,
	StartupDataProps,
	StoredTransactionsProps,
} from './components/Interfaces'
import {
	analyzeATR,
	analyzeCoppock,
	runATRAlgorithm,
	runCoppockAlgorithm,
	getAmountToBuy,
} from './components/calculations/'
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
	logOpenOrders,
	logStatus,
} from './utils/Logger'

const localStorage = new LocalStorage('./storage')
const transactionStorage = new LocalStorage('./transactions')

const startupData: StartupDataProps = { time: '', timestamp: 0 }
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

const storedBuySellHistory = JSON.parse(
	localStorage.getItem('buySellHistory') || '[]'
)
const buySellHistory: BuySellHistoryProps[] = storedBuySellHistory

let currentBuyStatus: string
let currentSellStatus: string

const storedCurrentBuys = JSON.parse(
	localStorage.getItem('currentBuys') || '{}'
)
const currentBuys: CurrentBuy = storedCurrentBuys

const storedOpenOrders = JSON.parse(localStorage.getItem('openOrders') || '{}')
const openOrders: OpenOrder = storedOpenOrders

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
	coinHistoryData.forEach((historyValue, index) => {
		const dateObject = new Date(historyValue.timestamp)
		const timeFormatted = dateObject.toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		})

		coinHistory.unshift(historyValue)
		priceChartData.push({ time: timeFormatted, price: historyValue })

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
	const storedTransactions: Array<StoredTransactionsProps> = JSON.parse(
		transactionStorage.getItem(startupData.timestamp.toString()) || '[]'
	)
	currentBuyStatus = 'Waiting for indication to buy'
	const currentPrice = await getPrice()
	try {
		displayLoadingHeader(startupData.time)

		const priceDateObject = new Date(currentPrice.timestamp)
		const priceTimeFormatted = priceDateObject.toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		})
		coinHistory.unshift(currentPrice)
		priceChartData.push({ time: priceTimeFormatted, price: currentPrice })

		const balance = await getBalance()

		const amountToBuy = await getAmountToBuy(currentPrice, balance)
		currentBuyStatus =
			amountToBuy === 0
				? `Not enough ${config.stableCoin.shortName} available to buy`
				: 'Waiting for indication to buy'

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

		if (Object.keys(openOrders).length > 0) {
			for (const key in openOrders) {
				const openOrder = openOrders[key]
				const orderStatus = await getOrderStatus(openOrder.orderId)
				const newBalance = await getBalance()
				const amountFee =
					orderStatus.fee.currency === config.coin.shortName
						? orderStatus.fee.cost
						: 0
				let buyAmount = orderStatus.filled - amountFee
				if (openOrder.type === IndicationType.BUY) {
					if (
						orderStatus.status === 'closed' ||
						orderStatus.status === 'canceled'
					) {
						if (buyAmount > newBalance.currentCoin) {
							buyAmount = newBalance.currentCoin
						}
						const buyId = `${config.coin.shortName}${Date.now()}`
						const atrValue = runATRAlgorithm(coinHistory)
						const buyCost =
							orderStatus.fee.currency === config.stableCoin.shortName
								? orderStatus.cost - orderStatus.fee.cost
								: orderStatus.cost
						buySellHistory.unshift({
							time: dateFormatted,
							status: IndicationType.BUY,
							coin: config.coin.shortName,
							buyAmount: buyAmount,
							buyCost: buyCost,
							averagePrice: orderStatus.average || openOrder.averagePrice,
						})
						atrValues.unshift({
							atr: atrValue,
							price: orderStatus.average || openOrder.averagePrice,
						})
						currentBuys[buyId] = {
							time: dateFormatted,
							buyPrice: buyCost,
							buyAmount: buyAmount,
							averagePrice: orderStatus.average || openOrder.averagePrice,
							atr: atrValue,
						}
						localStorage.setItem('currentBuys', JSON.stringify(currentBuys))
						localStorage.setItem(
							'buySellHistory',
							JSON.stringify(buySellHistory)
						)
						delete openOrders[key]
						localStorage.setItem('openOrders', JSON.stringify(openOrders))

						storedTransactions.unshift({
							time: orderStatus.timestamp,
							type: 'BOUGHT',
							coinPair: orderStatus.symbol,
							price: orderStatus.price,
							amount: orderStatus.filled,
							cost: orderStatus.cost,
							fee: orderStatus.fee.cost,
							feeCurrency: orderStatus.fee.currency,
						})
						transactionStorage.setItem(
							startupData.timestamp.toString(),
							JSON.stringify(storedTransactions)
						)
					} else {
						delete openOrders[key]
						const buyId = key
						const currentBalance = openOrder.currentBalance
						openOrders[buyId] = {
							time: dateFormatted,
							orderId: orderStatus.id,
							type: IndicationType.BUY,
							currentBalance: currentBalance,
							buyPrice: orderStatus.cost,
							buyAmount: orderStatus.amount,
							averagePrice: orderStatus.average || openOrder.averagePrice,
							remaining: orderStatus.remaining,
						}
						localStorage.setItem('openOrders', JSON.stringify(openOrders))
					}
				} else {
					const sellCost =
						orderStatus.fee.currency === config.stableCoin.shortName
							? orderStatus.cost - orderStatus.fee.cost
							: orderStatus.cost
					if (orderStatus.status === 'closed') {
						buySellHistory.unshift({
							time: dateFormatted,
							status: IndicationType.SELL,
							coin: config.coin.shortName,
							buyAmount: buyAmount,
							buyCost: sellCost,
							averagePrice: orderStatus.average || openOrder.averagePrice,
							result: sellCost - openOrder.averagePrice * buyAmount,
						})
						delete openOrders[key]
						localStorage.setItem('openOrders', JSON.stringify(openOrders))
						localStorage.setItem(
							'buySellHistory',
							JSON.stringify(buySellHistory)
						)

						storedTransactions.unshift({
							time: orderStatus.timestamp,
							type: 'SOLD',
							coinPair: orderStatus.symbol,
							price: orderStatus.price,
							amount: orderStatus.filled,
							cost: orderStatus.cost,
							fee: orderStatus.fee.cost,
							feeCurrency: orderStatus.fee.currency,
							result: orderStatus.cost - openOrder.averagePrice * buyAmount,
						})
						transactionStorage.setItem(
							startupData.timestamp.toString(),
							JSON.stringify(storedTransactions)
						)
					} else if (orderStatus.status === 'canceled') {
						buySellHistory.unshift({
							time: dateFormatted,
							status: IndicationType.SELL,
							coin: config.coin.shortName,
							buyAmount: buyAmount,
							buyCost: sellCost,
							averagePrice: orderStatus.average || openOrder.averagePrice,
							result:
								sellCost -
								((openOrder.averagePrice * buyAmount) / orderStatus.amount) *
									buyAmount,
						})
						const buyId = `${config.coin.shortName}${Date.now()}-REMAINING`
						const atrValue = runATRAlgorithm(coinHistory)
						buySellHistory.unshift({
							time: dateFormatted,
							status: IndicationType.BUY,
							coin: config.coin.shortName,
							buyAmount:
								openOrder.buyAmount -
								(newBalance.currentCoin - balance.currentCoin),
							buyCost:
								openOrder.averagePrice * buyAmount -
								((openOrder.averagePrice * buyAmount) / orderStatus.amount) *
									buyAmount,
							averagePrice: orderStatus.average || openOrder.averagePrice,
						})
						atrValues.unshift({
							atr: atrValue,
							price: orderStatus.average || openOrder.averagePrice,
						})
						currentBuys[buyId] = {
							time: dateFormatted,
							buyPrice:
								openOrder.averagePrice * buyAmount -
								((openOrder.averagePrice * buyAmount) / orderStatus.amount) *
									buyAmount,
							buyAmount:
								openOrder.buyAmount -
								(newBalance.currentCoin - balance.currentCoin),
							averagePrice: orderStatus.average || openOrder.averagePrice,
							atr: atrValue,
						}
						delete openOrders[key]
						localStorage.setItem('openOrders', JSON.stringify(openOrders))
						localStorage.setItem(
							'buySellHistory',
							JSON.stringify(buySellHistory)
						)
						localStorage.setItem('currentBuys', JSON.stringify(currentBuys))

						storedTransactions.unshift({
							time: orderStatus.timestamp,
							type: 'SOLD',
							coinPair: orderStatus.symbol,
							price: orderStatus.price,
							amount: orderStatus.filled,
							cost: orderStatus.cost,
							fee: orderStatus.fee.cost,
							feeCurrency: orderStatus.fee.currency,
							result:
								orderStatus.cost -
								((openOrder.averagePrice * buyAmount) / orderStatus.amount) *
									orderStatus.filled,
						})
						transactionStorage.setItem(
							startupData.timestamp.toString(),
							JSON.stringify(storedTransactions)
						)
					} else {
						delete openOrders[key]
						const buyId = key
						const currentBalance = openOrder.currentBalance
						openOrders[buyId] = {
							time: dateFormatted,
							orderId: orderStatus.id,
							type: IndicationType.SELL,
							currentBalance: currentBalance,
							buyPrice: openOrder.buyPrice,
							buyAmount: orderStatus.amount,
							averagePrice: orderStatus.average || openOrder.averagePrice,
							remaining: orderStatus.remaining,
						}
						localStorage.setItem('openOrders', JSON.stringify(openOrders))
					}
				}
			}
		}

		if (Object.keys(currentBuys).length < config.concurrentOrders) {
			if (amountToBuy > 0) {
				const maxBuyPrice = await getMaxBuyPrice('12h')
				try {
					if (currentPrice.average < maxBuyPrice) {
						const analyzeBuyResult = analyzeCoppock(coppockValues)
						switch (analyzeBuyResult) {
							case IndicationType.BUY: {
								const buyOrder = await createBuyOrder(amountToBuy)
								try {
									if (buyOrder.status === 'closed') {
										const newBalance = await getBalance()
										const amountFee =
											buyOrder.fee.currency === config.coin.shortName
												? buyOrder.fee.cost
												: 0
										let buyAmount = buyOrder.filled - amountFee
										if (buyAmount > newBalance.currentCoin) {
											buyAmount = newBalance.currentCoin
										}
										const buyId = `${config.coin.shortName}${Date.now()}`
										const atrValue = runATRAlgorithm(coinHistory)
										const buyCost =
											buyOrder.fee.currency === config.stableCoin.shortName
												? buyOrder.cost - buyOrder.fee.cost
												: buyOrder.cost
										buySellHistory.unshift({
											time: dateFormatted,
											status: IndicationType.BUY,
											coin: config.coin.shortName,
											buyAmount: buyAmount,
											buyCost: buyCost,
											averagePrice: currentPrice.average,
										})
										atrValues.unshift({
											atr: atrValue,
											price: currentPrice.average,
										})
										currentBuys[buyId] = {
											time: dateFormatted,
											buyPrice: buyCost,
											buyAmount: buyAmount,
											averagePrice: currentPrice.average,
											atr: atrValue,
										}
										localStorage.setItem(
											'currentBuys',
											JSON.stringify(currentBuys)
										)
										localStorage.setItem(
											'buySellHistory',
											JSON.stringify(buySellHistory)
										)

										storedTransactions.unshift({
											time: buyOrder.timestamp,
											type: 'BOUGHT',
											coinPair: buyOrder.symbol,
											price: buyOrder.price,
											amount: buyOrder.filled,
											cost: buyOrder.cost,
											fee: buyOrder.fee.cost,
											feeCurrency: buyOrder.fee.currency,
										})
										transactionStorage.setItem(
											startupData.timestamp.toString(),
											JSON.stringify(storedTransactions)
										)
									} else if (buyOrder.status === 'open') {
										const buyId = `${
											config.coin.shortName
										}${Date.now()}-PARTIAL`
										openOrders[buyId] = {
											time: dateFormatted,
											orderId: buyOrder.id,
											type: IndicationType.BUY,
											currentBalance: balance.currentCoin,
											buyPrice: buyOrder.cost,
											buyAmount: buyOrder.amount,
											averagePrice: currentPrice.average,
											remaining: buyOrder.remaining,
										}
										localStorage.setItem(
											'openOrders',
											JSON.stringify(openOrders)
										)
									} else {
										currentBuyStatus =
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
						currentBuyStatus = `Average price is above the buy limit (${maxBuyPrice} ${config.stableCoin.shortName})`
					}
				} catch (error) {
					logError(`Get price details error:  ${error}`)
				}
			} else {
				currentBuyStatus = `Not enough ${config.stableCoin.shortName} available to buy`
			}
		} else {
			currentBuyStatus = `Concurrent orders limit(${config.concurrentOrders}) is reached`
		}

		if (Object.keys(currentBuys).length > 0) {
			currentSellStatus = 'Waiting for indication to sell'
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
								const sellAmount =
									sellOrder.fee.currency === config.coin.shortName
										? sellOrder.filled - sellOrder.fee.cost
										: sellOrder.filled
								const sellCost =
									sellOrder.fee.currency === config.stableCoin.shortName
										? sellOrder.cost - sellOrder.fee.cost
										: sellOrder.cost
								buySellHistory.unshift({
									time: dateFormatted,
									status: IndicationType.SELL,
									coin: config.coin.shortName,
									buyAmount: sellAmount,
									buyCost: sellCost,
									averagePrice: currentPrice.average,
									result: sellCost - currentBuy.averagePrice * sellAmount,
								})
								currentSellStatus = ''
								delete currentBuys[key]
								localStorage.setItem('currentBuys', JSON.stringify(currentBuys))
								localStorage.setItem(
									'buySellHistory',
									JSON.stringify(buySellHistory)
								)

								storedTransactions.unshift({
									time: sellOrder.timestamp,
									type: 'SOLD',
									coinPair: sellOrder.symbol,
									price: sellOrder.price,
									amount: sellOrder.filled,
									cost: sellOrder.cost,
									fee: sellOrder.fee.cost,
									feeCurrency: sellOrder.fee.currency,
									result: sellOrder.cost - currentBuy.averagePrice * sellAmount,
								})
								transactionStorage.setItem(
									startupData.timestamp.toString(),
									JSON.stringify(storedTransactions)
								)
							} else if (sellOrder.status === 'open') {
								const buyId = `${config.coin.shortName}${Date.now()}-PARTIAL`
								openOrders[buyId] = {
									time: dateFormatted,
									orderId: sellOrder.id,
									type: IndicationType.SELL,
									currentBalance: balance.currentCoin,
									buyPrice: currentBuy.buyPrice,
									buyAmount: sellOrder.amount,
									averagePrice: currentPrice.average,
									remaining: sellOrder.remaining,
								}
								currentSellStatus = ''
								delete currentBuys[key]
								localStorage.setItem('openOrders', JSON.stringify(openOrders))
							} else {
								currentSellStatus =
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

		displayCurrentValueHeader(startupData.time, dateFormatted, coinHistory[0])
		logCurrentCoppockValue(coppockValues[0] || 0)
		logStatus(currentBuyStatus, currentSellStatus)
		logBalance(newBalance.total)
		logCurrentBuys(currentBuys)
		logOpenOrders(openOrders)
		logBuySellHistory(buySellHistory)
	} catch (error) {
		logError(`Get price error:  ${error}`)
	}
}

const run = (): void => {
	const dateObject = new Date()
	const dateFormatted = dateObject.toLocaleString()
	startupData.time = dateFormatted
	startupData.timestamp = dateObject.getTime()

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
run()

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
