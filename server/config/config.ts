import ccxt from 'ccxt'

const exchangeClient = new ccxt.binance({
	apiKey: process.env.API_KEY,
	secret: process.env.API_SECRET,
	enableRateLimit: true,
	timeout: 30000,
})
// exchangeClient.setSandboxMode(true) // For testing in sandbox environment

export default exchangeClient
