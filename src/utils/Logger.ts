/* eslint-disable no-console */
import chalk from 'chalk'

export const logInfo = (data: unknown): void => {
	console.log(chalk.blue(`${JSON.stringify(data)}`))
}

export const logError = (data: unknown): void => {
	console.log(chalk.red(`${JSON.stringify(data)}`))
}

export const logSuccess = (data: unknown): void => {
	console.log(chalk.green(`${JSON.stringify(data)}`))
}
