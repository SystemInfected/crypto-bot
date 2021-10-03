import * as React from 'react'
import { render } from 'react-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Header from './components/Header'
import PriceChart from './components/PriceChart'
import CoppockChart from './components/CoppockChart'
import ChartContainer from './components/ChartContainer'
import { logError } from './utils/Logger'

const App = (): JSX.Element => {
	const [chartData, setChartData] = useState({
		configData: { coin: '', stableCoin: '', minInitialValues: 0 },
		priceChartData: [{ time: '', price: 0 }],
		coppockChartData: [{ time: '', coppockValue: 0 }],
	})

	const axiosConfig = {
		timeout: 1000,
	}
	const getChartData = async (): Promise<void> => {
		axios
			.get('http://localhost:4000/chart_data', axiosConfig)
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
				<PriceChart data={priceChartData.slice(-60)} />
			</ChartContainer>
			<ChartContainer title="Coppock Curve">
				<CoppockChart data={coppockChartData.slice(-60)} />
			</ChartContainer>
		</>
	)
}

render(<App />, document.getElementById('app'))
