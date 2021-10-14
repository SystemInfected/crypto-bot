import * as React from 'react'
import { render } from 'react-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Header from './components/Header'
import PriceChart from './components/PriceChart'
import CoppockChart from './components/CoppockChart'
import ChartContainer from './components/ChartContainer'
import { logError } from './utils/Logger'
require('dotenv').config({ path: __dirname + '/./../../.env' })

const App = (): JSX.Element => {
	const [chartData, setChartData] = useState({
		configData: { coin: '', stableCoin: '', minInitialValues: 0 },
		priceChartData: [
			{
				time: '',
				price: {
					timestamp: 0,
					open: 0,
					high: 0,
					low: 0,
					close: 0,
					volume: 0,
					average: 0,
				},
			},
		],
		coppockChartData: [{ time: '', coppockValue: 0 }],
	})

	const axiosConfig = {
		timeout: 1000,
	}
	const getChartData = async (): Promise<void> => {
		axios
			.get(`http://localhost:${process.env.PORT}/chart_data`, axiosConfig)
			.then((dataRes) => {
				setChartData(dataRes.data)
			})
			.catch((error) => {
				logError(error)
			})
	}

	useEffect(() => {
		getChartData()
		setInterval(() => {
			getChartData()
		}, 2000)
	}, [])

	const { configData, priceChartData, coppockChartData } = chartData

	return (
		<>
			<Header />
			<ChartContainer title={`${configData.coin} / ${configData.stableCoin}`}>
				<PriceChart data={priceChartData.slice(-50)} />
			</ChartContainer>
			<ChartContainer title="Coppock Curve">
				<CoppockChart data={coppockChartData.slice(-50)} />
			</ChartContainer>
		</>
	)
}

render(<App />, document.getElementById('app'))
