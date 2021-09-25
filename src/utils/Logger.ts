/* eslint-disable no-console */
import chalk from 'chalk'

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
	//console.clear()
	console.log(
		chalk.green('Current value: ') +
			chalk.green.bold(value.toString()) +
			` Updated: ${time}`
	)
}

export const logCurrentCoppockValue = (value: number): void => {
	//console.clear()
	console.log(
		chalk.green('Current Coppock value: ') + chalk.green.bold(value.toString())
	)
}

export const clearLog = (): void => {
	console.clear()
}
