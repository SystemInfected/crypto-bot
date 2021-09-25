/* eslint-disable @typescript-eslint/camelcase */
import {
	CoinGeckoClient,
	PingResponse,
	SimplePriceResponse,
} from 'coingecko-api-v3'
const client = new CoinGeckoClient({
	timeout: 10000,
	autoRetry: true,
})

export const ping = async (): Promise<PingResponse> => {
	const ping = await client.ping()
	return ping
}

export const getPrice = async (
	crypto: string,
	fiat: string
): Promise<SimplePriceResponse> => {
	const price = await client.simplePrice({
		ids: crypto,
		vs_currencies: fiat,
		include_last_updated_at: true,
	})
	return price
}
