/* eslint-disable no-console */
import chalk from 'chalk'
import { config } from './ValidatedConfig'
import { CurrentBuy, IndicationType } from '../components/Interfaces'
import { Balance } from 'ccxt'
require('dotenv').config()

export const logHeader = (time: string): void => {
	console.log(
		chalk.whiteBright.bold('Crypto Bot v 1.0.0') +
			chalk.whiteBright(
				` | Started: ${time.toString()}\nGraph frontend: http://localhost:${
					process.env.PORT
				}/`
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
				`${config.coin.shortName} (${value.toString()} ${
					config.stableCoin.shortName
				})`
			) +
			chalk.white(` Updated: ${time}`)
	)
}

export const logCurrentCoppockValue = (value: number): void => {
	console.log(
		chalk.green('Current Coppock value: ') + chalk.green.bold(value.toString())
	)
}

export const logBalance = (balance: Balance): void => {
	const balanceString = Object.keys(balance)
		.map((key, index) => {
			const coinBalance = Object.values(balance).filter(
				(value, i) => i === index
			)
			return `${key}: ${coinBalance}`
		})
		.join(', ')
	console.log(
		chalk.blue('\nExchange balance: ') + chalk.white.bold(balanceString)
	)
}

export const logCurrentBuys = (currentBuys: CurrentBuy): void => {
	console.log(chalk.green('\nCurrent active orders:'))
	for (const key in currentBuys) {
		const currentBuy = currentBuys[key]
		console.log(
			chalk.green.bold(`${key}: `) +
				chalk.green(
					`${config.coin.shortName} ${currentBuy.buyAmount} (Cost: ${currentBuy.buyPrice} ${config.stableCoin.shortName})`
				) +
				chalk.white(
					` ATR:${currentBuy.atr * currentBuy.buyAmount} (x${
						config.ATRmultiplier
					}) | ${currentBuy.time}`
				)
		)
	}
}

export const logBuySellHistory = (
	buySellIndicationArr: Array<{
		time: string
		status: IndicationType
		buyAmount: number
		buyCost: number
		marketPrice: number
		result?: number
	}>
): void => {
	console.log(chalk.green('\nOrder history:'))
	buySellIndicationArr.slice(0, 20).forEach((buySellIndication) => {
		if (buySellIndication.status === IndicationType.BUY) {
			console.log(
				chalk.green(`${buySellIndication.time}: `) +
					chalk.green.bold('BUY ') +
					chalk.green(
						`${config.coin.shortName} ${buySellIndication.buyAmount} á ${buySellIndication.marketPrice} ${config.stableCoin.shortName} (Cost: ${buySellIndication.buyCost} ${config.stableCoin.shortName})`
					)
			)
		} else if (buySellIndication.status === IndicationType.SELL) {
			console.log(
				chalk.green(`${buySellIndication.time}: `) +
					chalk.green.bold('SELL ') +
					chalk.green(
						`${config.coin.shortName} ${buySellIndication.buyAmount} á ${buySellIndication.marketPrice} ${config.stableCoin.shortName} (Gain: ${buySellIndication.result} ${config.stableCoin.shortName})`
					)
			)
		}
	})
}

export const clearLog = (): void => {
	console.clear()
}
