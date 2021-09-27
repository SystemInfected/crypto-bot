import * as React from 'react'
import { render } from 'react-dom'
import Header from './components/Header'
import PriceChart from './components/PriceChart'
import CoppockChart from './components/CoppockChart'
import ChartContainer from './components/ChartContainer'

const priceChartData = [
	{
		time: '20:40',
		price: 2400,
		buySell: 'SELL',
	},
	{
		time: '20:40',
		price: 1398,
	},
	{
		time: '20:40',
		price: 9800,
		buySell: 'BUY',
	},
	{
		time: '20:40',
		price: 3908,
		buySell: 'SELL',
	},
	{
		time: '20:40',
		price: 4800,
	},
	{
		time: '20:40',
		price: 3800,
	},
	{
		time: '20:40',
		price: 4300,
		buySell: 'BUY',
	},
]

const CoppockChartData = [
	{
		time: '20:40',
		coppockValue: 1,
	},
	{
		time: '20:40',
		coppockValue: 0.8,
	},
	{
		time: '20:40',
		coppockValue: 0.4,
	},
	{
		time: '20:40',
		coppockValue: 0.1,
	},
	{
		time: '20:40',
		coppockValue: -0.4,
	},
	{
		time: '20:40',
		coppockValue: -0.6,
	},
	{
		time: '20:40',
		coppockValue: -0.7,
	},
]

const App = (): JSX.Element => {
	return (
		<>
			<Header />
			<ChartContainer title="Ethereum / USDT">
				<PriceChart data={priceChartData} />
			</ChartContainer>
			<ChartContainer title="Coppock Curve">
				<CoppockChart data={CoppockChartData} />
			</ChartContainer>
		</>
	)
}

render(<App />, document.getElementById('app'))
