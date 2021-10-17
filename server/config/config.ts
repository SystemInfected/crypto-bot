import ccxt from 'ccxt'

const exchangeClient = new ccxt.binance({
	apiKey: process.env.API_TEST_KEY,
	secret: process.env.API_TEST_SECRET,
	// password: process.env.API_TEST_PASSWORD,
	enableRateLimit: true,
})
exchangeClient.setSandboxMode(true)

export default exchangeClient
