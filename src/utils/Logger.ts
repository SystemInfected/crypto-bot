/* eslint-disable no-console */
import chalk from 'chalk'
import { GlobalConfig, IndicationType } from '../components/Interfaces'

export const logHeader = (time: string): void => {
	console.log(
		chalk.whiteBright.bold('Crypto Bot') +
			chalk.whiteBright(` | Started: ${time.toString()}`)
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
			` Updated: ${time}`
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
	map: Map<string, [GlobalConfig, IndicationType, number, number]>
): void => {
	map.forEach((value, key) => {
		if (value[1] === IndicationType.BUY) {
			console.log(
				chalk.green(`${key}: `) +
					chalk.green.bold('BUY ') +
					chalk.green(
						`${value[0].coin.short} (${value[2]} ${value[0].stableCoin.short}) | ATR:${value[1]}`
					)
			)
		} else if (value[1] === IndicationType.SELL) {
			console.log(
				chalk.green(`${key}: `) +
					chalk.green.bold('SELL ') +
					chalk.green(
						`${value[0].coin.short} (${value[2]} ${value[0].stableCoin.short}) | GAIN:${value[1]} ${value[0].stableCoin.short}`
					)
			)
		}
	})
}

export const clearLog = (): void => {
	console.clear()
}
