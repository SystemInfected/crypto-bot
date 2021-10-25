import fs from 'fs'
import path from 'path'
import { LocalStorage } from 'node-localstorage'
import { StoredTransactionsProps } from './components/Interfaces'
import { logError, logInfo, logSuccess } from './utils/Logger'

interface ExportedTransactions extends StoredTransactionsProps {
	result?: number
	date: string
}

const transactionStorage = new LocalStorage('./transactions')

const storedTransactions: ExportedTransactions[] = []

let exportedTransactions =
	'Date,Timestamp,Order side,Coin pair,Price,Amount,Cost,Fee,Result\n'

fs.readdir(path.join(__dirname, '../transactions'), (err, files) => {
	if (err) logError(err)
	else {
		files.forEach((file) => {
			if (!file.startsWith('.DS_Store') && !file.startsWith('exported')) {
				const transactions = JSON.parse(
					transactionStorage.getItem(file) || '{}'
				)
				transactions.map((transaction: ExportedTransactions) => {
					transaction.date = new Date(transaction.time).toLocaleString()
					if (
						storedTransactions.filter((t) => t.time === transaction.time)
							.length === 0
					) {
						storedTransactions.push(transaction)
					}
				})
				fs.unlink(path.join(__dirname, '../transactions', file), (err) => {
					if (err) logError(err)
				})
			}
		})
		storedTransactions.sort((a, b) => b.time - a.time)

		const options = {
			maximumFractionDigits: 20,
		}
		storedTransactions.map((transaction) => {
			exportedTransactions += `${transaction.date},${transaction.time},${
				transaction.type
			},${transaction.coinPair},"${transaction.price.toLocaleString(
				undefined,
				options
			)}","${transaction.amount.toLocaleString(
				undefined,
				options
			)}","${transaction.cost.toLocaleString(
				undefined,
				options
			)}","${transaction.fee.toLocaleString(undefined, options)} ${
				transaction.feeCurrency
			}","${
				transaction.result
					? transaction.result.toLocaleString(undefined, options)
					: ''
			}"\n`
		})

		fs.writeFile(
			path.join(__dirname, '../transactions', 'exported-transactions.csv'),
			exportedTransactions,
			(err) => {
				if (err) logError(err)
				else {
					logInfo(
						'Transactions successfully exported\nThe exported file is available here:'
					)
					logSuccess(
						path.resolve(
							path.join(
								__dirname,
								'../transactions',
								'exported-transactions.csv'
							)
						)
					)
				}
			}
		)

		transactionStorage.setItem(
			'allTransactions',
			JSON.stringify(storedTransactions)
		)
	}
})
