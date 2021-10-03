/* eslint-disable @typescript-eslint/camelcase */
import {
	CoinFullInfo,
	CoinGeckoClient,
	PingResponse,
	SimplePriceResponse,
	CoinMarketChartResponse,
} from 'coingecko-api-v3'
import { config } from '../utils/ValidatedConfig'
const client = new CoinGeckoClient({
	timeout: 10000,
	autoRetry: true,
})

export const ping = async (): Promise<PingResponse> => {
	const ping = await client.ping()
	return ping
}

export const getPrice = async (): Promise<SimplePriceResponse> => {
	const price = await client.simplePrice({
		ids: `${config.coin.fullName.toLowerCase()},${config.stableCoin.fullName.toLowerCase()}`,
		vs_currencies: 'usd',
		include_last_updated_at: true,
	})
	return price
}

export const getPriceDetails = async (): Promise<CoinFullInfo> => {
	const price = await client.coinId({
		id: config.coin.fullName.toLowerCase(),
		localization: false,
		tickers: false,
		community_data: false,
		developer_data: false,
	})
	return price
}

export const getPriceHistory = async (): Promise<CoinMarketChartResponse> => {
	const lookBack =
		Math.floor(Date.now() / 1000) - config.minAlgorithmValues * 300
	const history = await client.coinIdMarketChartRange({
		id: config.coin.fullName.toLowerCase(),
		vs_currency: 'usd',
		from: lookBack,
		to: Math.floor(Date.now() / 1000),
	})
	return history
}
