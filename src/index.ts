import { getPrice, ping } from './components/CryptoData'
import {
	logError,
	logInfo,
	logCoinValue,
	logSuccess,
	clearLog,
} from './utils/Logger'
require('dotenv').config()

interface GlobalConfig {
	/** Interval (minutes) inbetween each request for current values | Coingecko caching is about 2-3 minutes so anything under that is unnecessary */
	tickInterval: number
	/** For ROC 14 at least 15 intervals are needed */
	minInitialValues: number
	/** For WMA 10 of ROC 14 at least 25 intervals are needed */
	minAlgorithmValues: number
}

const globalConfig: GlobalConfig = {
	tickInterval: 2,
	minInitialValues: 15,
	minAlgorithmValues: 25,
}

const ethereumTether: number[] = []

const tick = async (): Promise<void> => {
	await getPrice('ethereum,tether', 'usd')
		.then((response) => {
			const marketPrice = response.ethereum.usd / response.tether.usd
			const dateObject = new Date(response.ethereum.last_updated_at * 1000)
			const humanDateFormat = dateObject.toLocaleString()
			ethereumTether.unshift(marketPrice)
			if (ethereumTether.length < globalConfig.minAlgorithmValues) {
				if (ethereumTether.length > 1) {
					clearLog()
				}
				if (ethereumTether.length < globalConfig.minInitialValues) {
					logInfo(
						`Firing up the engines!\nPlease allow ${(globalConfig.minInitialValues -
							ethereumTether.length) *
							globalConfig.tickInterval} minute(s) to pass for the algorithm to collect enough data`
					)
				} else {
					logInfo(
						`Algorithm is starting up...\nPlease allow ${(globalConfig.minAlgorithmValues -
							ethereumTether.length) *
							globalConfig.tickInterval} minute(s) more to pass for the algorithm to collect enough data`
					)
				}
			} else {
				clearLog()
				logInfo('Algorithm is running!')

				// TODO: 1. Get ROC 14
				// TODO: 2. Get ROC 11
				// TODO: 3. Get WMA 10 [ROC 14 , ROC 11]
				// TODO: 4. Display Coppock Value
			}
			logCoinValue(humanDateFormat, marketPrice)
			logSuccess(ethereumTether)
		})
		.catch((err) => logError(err))
}

const run = (): void => {
	tick()
	setInterval(tick, globalConfig.tickInterval * 1000 * 60)
}

logInfo('Connecting to crypto server...')
ping()
	.then((data) => {
		logInfo(data.gecko_says)
		run()
	})
	.catch((err) => logError(err))
