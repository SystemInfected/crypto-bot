import ccxt, { Balance, OHLCV, Order } from 'ccxt'

import { config } from '../utils/ValidatedConfig'
import { TickerValue } from './Interfaces'

/* const exchangeClient = new ccxt.binance({
	apiKey: process.env.API_KEY,
	secret: process.env.API_SECRET,
	enableRateLimit: true,
}) */

const exchangeClient = new ccxt.binance({
	apiKey: process.env.API_TEST_KEY,
	secret: process.env.API_TEST_SECRET,
	enableRateLimit: true,
})
exchangeClient.setSandboxMode(true)

/* export const ping = async (): Promise<string> => {
	const ping = await exchangeClient.fetchStatus()
	return ping.status
} */
export const ping = (): string => {
	const ping = 'ok'
	return ping
}

export const getBalance = async (): Promise<{
	total: Balance
	currentCoin: number
}> => {
	const balance = await exchangeClient.fetchBalance()

	return {
		total: balance.total,
		currentCoin: balance.total[config.stableCoin.shortName as keyof Balance],
	}
}

export const createBuyOrder = async (buyAmount: number): Promise<Order> => {
	const buyOrder = await exchangeClient.createMarketOrder(
		`${config.coin.shortName}/${config.stableCoin.shortName}`,
		'buy',
		buyAmount
	)
	return buyOrder
}

export const createSellOrder = async (sellAmount: number): Promise<Order> => {
	const sellOrder = await exchangeClient.createMarketOrder(
		`${config.coin.shortName}/${config.stableCoin.shortName}`,
		'sell',
		sellAmount
	)
	return sellOrder
}

export const getPrice = async (): Promise<TickerValue> => {
	const lookBack = Math.floor(Date.now()) - config.tickInterval * 60 * 1000 * 3
	const priceData = await exchangeClient.fetchOHLCV(
		`${config.coin.shortName}/${config.stableCoin.shortName}`,
		`${config.tickInterval}m`,
		lookBack
	)
	const i = priceData.length - 1
	const price: TickerValue = {
		timestamp: priceData[i][0],
		open: priceData[i][1],
		high: priceData[i][2],
		low: priceData[i][3],
		close: priceData[i][4],
		volume: priceData[i][5],
	}
	return price
}

export const get12hPriceDetails = async (): Promise<{
	timestamp: number
	open: number
	high: number
	low: number
	close: number
	volume: number
}> => {
	const lookBack = Math.floor(Date.now()) - 1 * 3600 * 1000 * 24 // 1 days back
	const price = await exchangeClient.fetchOHLCV(
		`${config.coin.shortName}/${config.stableCoin.shortName}`,
		'12h',
		lookBack
	)
	return {
		timestamp: price[price.length - 1][0],
		open: price[price.length - 1][1],
		high: price[price.length - 1][2],
		low: price[price.length - 1][3],
		close: price[price.length - 1][4],
		volume: price[price.length - 1][5],
	}
}

export const getPriceHistory = async (): Promise<OHLCV[]> => {
	const lookBack =
		Math.floor(Date.now()) -
		(config.minAlgorithmValues + 1) * (config.tickInterval * 60000)
	const history = await exchangeClient.fetchOHLCV(
		`${config.coin.shortName}/${config.stableCoin.shortName}`,
		`${config.tickInterval}m`,
		lookBack
	)
	return history.slice(1, config.minAlgorithmValues)
}
