import { config } from '../../utils/ValidatedConfig'
import { BalanceResponse, CoinValuesProps } from '../Interfaces'

export const getAmountToBuy = (
	currentPrice: CoinValuesProps,
	balance: BalanceResponse
): number => {
	const fluctuationMultiplier = 1.2
	let amountToBuyFor = balance.currentStableCoin * config.allocation
	if (amountToBuyFor < config.minOrderSize * fluctuationMultiplier) {
		if (
			config.minOrderSize * fluctuationMultiplier <
			balance.currentStableCoin
		) {
			amountToBuyFor = config.minOrderSize * fluctuationMultiplier
		} else {
			amountToBuyFor = 0
		}
	}

	let amountToBuy = amountToBuyFor / currentPrice.close
	if (amountToBuy > 0 && amountToBuy < config.minTradeAmount) {
		if (
			config.minOrderSize * fluctuationMultiplier <
			balance.currentStableCoin
		) {
			amountToBuyFor = config.minOrderSize * fluctuationMultiplier
			amountToBuy = amountToBuyFor / currentPrice.close
			if (amountToBuy < config.minTradeAmount) {
				amountToBuyFor = 0
				amountToBuy = 0
			}
		} else {
			amountToBuyFor = 0
			amountToBuy = 0
		}
	}
	return amountToBuy
}
