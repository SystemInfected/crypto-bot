import { getPrice, ping } from './components/CryptoData'
import { displayCurrentValueMessage } from './utils/Messenger'
import { logError, logInfo } from './utils/Logger'
import { GlobalConfig } from './components/Interfaces'
require('dotenv').config()

const globalConfig: GlobalConfig = {
	tickInterval: 0.1,
	minInitialValues: 15,
	minAlgorithmValues: 25,
	longROC: 14,
	shortROC: 11,
	WMA: 10,
}

const ethereumTether: number[] = []

const tick = async (): Promise<void> => {
	await getPrice('ethereum,tether', 'usd')
		.then((response) => {
			const marketPrice = response.ethereum.usd / response.tether.usd
			const dateObject = new Date(response.ethereum.last_updated_at * 1000)
			const dateFormatted = dateObject.toLocaleString()
			ethereumTether.unshift(marketPrice)
			displayCurrentValueMessage(
				marketPrice,
				dateFormatted,
				ethereumTether,
				globalConfig
			)
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
