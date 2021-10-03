/* eslint-disable no-console */
import chalk from 'chalk'
import { config } from './ValidatedConfig'
import { CurrentBuy, IndicationType } from '../components/Interfaces'

export const logHeader = (time: string): void => {
	console.log(
		chalk.whiteBright.bold('Crypto Bot') +
			chalk.whiteBright(
				` | Started: ${time.toString()}\nGraph frontend: http://localhost:4000/`
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

export const logCoinValue = (time: string, value: number): void => {
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

export const logCurrentBuys = (currentBuys: CurrentBuy): void => {
	console.log(chalk.green('\nCurrent active orders:'))
	for (const key in currentBuys) {
		const currentBuy = currentBuys[key]
		console.log(
			chalk.green.bold(`${key}: `) +
				chalk.green(
					`${config.coin.short} (${currentBuy.price} ${config.stableCoin.short})`
				) +
				chalk.white(
					` ATR:${currentBuy.atr} (x${config.ATRmultiplier}) | ${currentBuy.time}`
				)
		)
	}
}

export const logBuySellIndication = (
	buySellIndicationArr: Array<{
		time: string
		status: IndicationType
		price: number
		result: number
	}>
): void => {
	console.log(chalk.green('\nOrder history:'))
	buySellIndicationArr.forEach((buySellIndication) => {
		if (buySellIndication.status === IndicationType.BUY) {
			console.log(
				chalk.green(`${buySellIndication.time}: `) +
					chalk.green.bold('BUY ') +
					chalk.green(
						`${config.coin.short} (${buySellIndication.price} ${config.stableCoin.short})`
					)
			)
		} else if (buySellIndication.status === IndicationType.SELL) {
			console.log(
				chalk.green(`${buySellIndication.time}: `) +
					chalk.green.bold('SELL ') +
					chalk.green(
						`${config.coin.short} (${buySellIndication.price} ${config.stableCoin.short}) | GAIN (per 1 ${config.coin.short}):${buySellIndication.result} ${config.stableCoin.short}`
					)
			)
		}
	})
}

export const clearLog = (): void => {
	console.clear()
}
