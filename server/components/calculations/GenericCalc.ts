import { Order } from 'ccxt'

export const getFee = (order: Order, coin: string): number => {
	const fee = order.fee.currency === coin ? order.fee.cost : 0
	return fee
}

export const getNewAveragePrice = (
	oldAveragePrice: number,
	amountBought: number
): number => {
	return oldAveragePrice * amountBought
}
