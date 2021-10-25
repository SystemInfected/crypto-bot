import { Balance, Order } from 'ccxt'
import { config } from '../utils/ValidatedConfig'
import { CoinValuesProps, TickerValue } from './Interfaces'
import exchangeClient from '../config/config'

export const getBalance = async (): Promise<{
	total: Balance
	currentStableCoin: number
	currentCoin: number
}> => {
	const balance = await exchangeClient.fetchBalance()

	return {
		total: balance.total,
		currentStableCoin:
			balance.total[config.stableCoin.shortName as keyof Balance],
		currentCoin: balance.total[config.coin.shortName as keyof Balance],
	}
}

export const createBuyOrder = async (
	coin: string,
	buyAmount: number
): Promise<Order> => {
	await exchangeClient.loadMarkets()
	const buyOrder = await exchangeClient.createMarketOrder(
		`${coin}/${config.stableCoin.shortName}`,
		'buy',
		buyAmount
	)
	return buyOrder
}

export const createSellOrder = async (sellAmount: number): Promise<Order> => {
	await exchangeClient.loadMarkets()
	const sellOrder = await exchangeClient.createMarketOrder(
		`${config.coin.shortName}/${config.stableCoin.shortName}`,
		'sell',
		sellAmount
	)
	return sellOrder
}

export const getOrderStatus = async (orderId: string): Promise<Order> => {
	const orderStatus = await exchangeClient.fetchOrder(
		orderId,
		`${config.coin.shortName}/${config.stableCoin.shortName}`
	)
	return orderStatus
}

export const getPrice = async (coin: string): Promise<CoinValuesProps> => {
	const lookBack = Math.floor(Date.now()) - config.tickInterval * 60 * 1000 * 3
	const priceData = await exchangeClient.fetchOHLCV(
		`${coin}/${config.stableCoin.shortName}`,
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

	const averagePrice = (price.open + price.high + price.low + price.close) / 4
	const currentPrice: CoinValuesProps = {
		timestamp: price.timestamp,
		open: price.open,
		high: price.high,
		low: price.low,
		close: price.close,
		volume: price.volume,
		average: averagePrice,
	}

	return currentPrice
}

export const getMaxBuyPrice = async (time: string): Promise<number> => {
	const lookBack = Math.floor(Date.now()) - 1 * 3600 * 1000 * 24 // 1 days back
	const price = await exchangeClient.fetchOHLCV(
		`${config.coin.shortName}/${config.stableCoin.shortName}`,
		time,
		lookBack
	)
	const priceDetails = {
		timestamp: price[price.length - 1][0],
		open: price[price.length - 1][1],
		high: price[price.length - 1][2],
		low: price[price.length - 1][3],
		close: price[price.length - 1][4],
		volume: price[price.length - 1][5],
	}
	const maxBuyPrice =
		priceDetails.open +
		(priceDetails.close - priceDetails.open) * config.falsePositiveBuffer
	return maxBuyPrice
}

export const getPriceHistory = async (): Promise<CoinValuesProps[]> => {
	const lookBack =
		Math.floor(Date.now()) -
		(config.minAlgorithmValues + 1) * (config.tickInterval * 60000)
	const history = await exchangeClient.fetchOHLCV(
		`${config.coin.shortName}/${config.stableCoin.shortName}`,
		`${config.tickInterval}m`,
		lookBack
	)
	const historyData = history.slice(1, config.minAlgorithmValues)
	const historyResponse = historyData.map((history) => {
		const averagePrice = (history[1] + history[2] + history[3] + history[4]) / 4
		const coinValue: CoinValuesProps = {
			timestamp: history[0],
			open: history[1],
			high: history[2],
			low: history[3],
			close: history[4],
			volume: history[5],
			average: averagePrice,
		}
		return coinValue
	})

	return historyResponse
}
