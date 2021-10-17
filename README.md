# crypto-bot
### A trading bot for trading cryptocurrency

The algorithm is based on the <a href="https://en.wikipedia.org/wiki/Coppock_curve" target="_blank">Coppock Curve</a> for **BUY** indication and ATR (WMA10 of TR) for **SELL** indication.

CCXT is used to get current price data and connect to exchange.  
<a href="https://ccxt.readthedocs.io/en/latest/manual.html#exchanges" target="_blank">Available exchanges with CCXT</a>

_ATT: This is built mostly for fun. I am no trading expert, use this at your own risk._

### Installation

1. Create a .env file in root with desired port and API keys  
Structure depending on exchange API
```
PORT=4040
API_KEY=ABCDE
API_SECRET=FGHIJ
API_PASSWORD=KLMNO
```

2. Configure exchange connection in _/server/config/config.ts_  
See CCXT documentation for more details on exchange structure
```ts
const exchangeClient = new ccxt.yourselectedexchange({
	apiKey: process.env.API_KEY,
	secret: process.env.API_SECRET,
	password: process.env.API_PASSWORD,
	enableRateLimit: true,
})
exchangeClient.setSandboxMode(true) // For testing in sandbox environment
```

3. Configure algorithm and trading configurations in _/server/config/config.json_  
Schema available at _/server/config/schema.config.json_
```json
{
	"coin": {
		"shortName": "BTC",
		"fullName": "Bitcoin"
	},
	"stableCoin": {
		"shortName": "USDT",
		"fullName": "Tether"
	},
	"allocation": 0.1,
	"tickInterval": 3,
	"concurrentOrders": 3,
	"minInitialValues": 15,
	"minAlgorithmValues": 25,
	"longROC": 14,
	"shortROC": 11,
	"WMA": 10,
	"buyBuffer": 4,
	"falsePositiveBuffer": 0.6,
	"sellBuffer": 2,
	"ATRmultiplier": 2.5
}
```

4. Build graph frontend
```
cd web
npm run build
```

5. Start the bot from root
```
cd ..
npm run start
```
