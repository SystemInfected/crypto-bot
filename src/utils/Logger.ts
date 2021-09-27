/* eslint-disable no-console */
import chalk from 'chalk'
import { GlobalConfig, IndicationType } from '../components/Interfaces'

export const logHeader = (time: string): void => {
	console.log(
		chalk.whiteBright.bold('Crypto Bot') +
			chalk.whiteBright(
				` | Started: ${time.toString()}\nGraph frontend: http://localhost:3030`
			)
	)
}

export const logInfo = (data: unknown): void => {
	if (typeof data === 'string') {
		console.log(chalk.blue(`${data}`))
	} else {
		console.log(chalk.blue(`${JSON.stringify(data)}`))
	}
}

export const logError = (data: unknown): void => {
	if (typeof data === 'string') {
		console.log(chalk.red(`${data}`))
	} else {
		console.log(chalk.red(`${JSON.stringify(data)}`))
	}
}

export const logSuccess = (data: unknown): void => {
	if (typeof data === 'string') {
		console.log(chalk.green(`${data}`))
	} else {
		console.log(chalk.green(`${JSON.stringify(data)}`))
	}
}

export const logCoinValue = (
	config: GlobalConfig,
	time: string,
	value: number
): void => {
	console.log(
		chalk.green('Current value: ') +
			chalk.green.bold(
				`${config.coin.short} (${value.toString()} ${config.stableCoin.short})`
			) +
			chalk.white(` Updated: ${time}`)
	)
}

export const logCurrentCoppockValue = (value: number): void => {
	console.log(
		chalk.green('Current Coppock value: ') + chalk.green.bold(value.toString())
	)
}

export const logCurrentATRValue = (
	config: GlobalConfig,
	value: number
): void => {
	console.log(
		chalk.green('ATR to trigger SELL: ') +
			chalk.green.bold(`${value.toString()}(x${config.ATRmultiplier})`)
	)
}

export const logBuySellIndication = (
	buySellIndicationArr: Array<{
		time: string
		config: GlobalConfig
		status: IndicationType
		price: number
		result: number
	}>
): void => {
	buySellIndicationArr.forEach((buySellIndication) => {
		if (buySellIndication.status === IndicationType.BUY) {
			console.log(
				chalk.green(`${buySellIndication.time}: `) +
					chalk.green.bold('BUY ') +
					chalk.green(
						`${buySellIndication.config.coin.short} (${buySellIndication.price} ${buySellIndication.config.stableCoin.short}) | ATR:${buySellIndication.result}`
					)
			)
		} else if (buySellIndication.status === IndicationType.SELL) {
			console.log(
				chalk.green(`${buySellIndication.time}: `) +
					chalk.green.bold('SELL ') +
					chalk.green(
						`${buySellIndication.config.coin.short} (${buySellIndication.price} ${buySellIndication.config.stableCoin.short}) | GAIN:${buySellIndication.result} ${buySellIndication.config.stableCoin.short}`
					)
			)
		}
	})
}

export const clearLog = (): void => {
	console.clear()
}
