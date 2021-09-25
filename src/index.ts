import { getPrice, ping } from './components/CryptoData'
import { logError, logInfo, logCoinValue, logSuccess } from './utils/Logger'
require('dotenv').config()

interface Config {
	tickInterval: number // minutes
	minInitialValues: number // for ROC 14 at least 15 intervals are needed
}

const globalConfig: Config = {
	tickInterval: 3,
	minInitialValues: 15,
}

const ethereumTether: number[] = []

const tick = async (): Promise<void> => {
	await getPrice('ethereum,tether', 'usd')
		.then((response) => {
			const marketPrice = response.ethereum.usd / response.tether.usd
			const dateObject = new Date(response.ethereum.last_updated_at * 1000)
			const humanDateFormat = dateObject.toLocaleString()
			ethereumTether.unshift(marketPrice)
			logCoinValue(humanDateFormat, marketPrice)
			logSuccess(ethereumTether)
			if (ethereumTether.length < globalConfig.minInitialValues) {
				logInfo(
					`Firing up the engines: Please allow ${(globalConfig.minInitialValues -
						ethereumTether.length) *
						globalConfig.tickInterval} minute(s) to pass for the algorithm to collect enough data`
				)
			}
		})
		.catch((err) => logError(err))
}

const run = (): void => {
	tick()
	setInterval(tick, globalConfig.tickInterval * 1000 * 60)
}

ping()
	.then((data) => {
		logInfo(data.gecko_says)
		run()
	})
	.catch((err) => logError(err))
