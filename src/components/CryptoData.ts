import { CoinGeckoClient, PingResponse } from 'coingecko-api-v3'
const client = new CoinGeckoClient({
	timeout: 10000,
	autoRetry: true,
})

export const ping = async (): Promise<PingResponse> => {
	const ping = await client.ping()
	return ping
}
