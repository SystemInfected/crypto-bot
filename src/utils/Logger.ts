/* eslint-disable no-console */
import chalk from 'chalk'

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

export const logCoinValue = (time: string, value: number): void => {
	console.log(
		chalk.green('Current value: ') +
			chalk.green.bold(value.toString()) +
			` Updated: ${time}`
	)
}

export const logCurrentCoppockValue = (value: number): void => {
	console.log(
		chalk.green('Current Coppock value: ') + chalk.green.bold(value.toString())
	)
}

export const logBuySellIndication = (
	map: Map<string, [number, number, string]>
): void => {
	map.forEach((value, key) => {
		console.log(
			chalk.green.bold(`${key}: `) +
				chalk.green(`${value[0]} - ${value[2]} | ${value[1]}`)
		)
	})
}

export const clearLog = (): void => {
	console.clear()
}
