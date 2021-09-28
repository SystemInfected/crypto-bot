import * as React from 'react'
import { render } from 'react-dom'
import { useState } from 'react'
import axios from 'axios'
import Header from './components/Header'
import PriceChart from './components/PriceChart'
import CoppockChart from './components/CoppockChart'
import ChartContainer from './components/ChartContainer'
import { logError } from './utils/Logger'

const App = (): JSX.Element => {
	const [serverData, setServerData] = useState({
		configData: { coin: '', stableCoin: '' },
		priceChartData: [{ time: '', price: 0 }],
		coppockChartData: [{ time: '', coppockValue: 0 }],
	})

	axios
		.get('http://localhost:4000/chart_data')
		.then((dataRes) => {
			setServerData(dataRes.data)
		})
		.catch((error) => {
			logError(error)
		})

	const { configData, priceChartData, coppockChartData } = serverData

	return (
		<>
			<Header />
			<ChartContainer title={`${configData.coin} / ${configData.stableCoin}`}>
				<PriceChart data={priceChartData.slice(-20)} />
			</ChartContainer>
			<ChartContainer title="Coppock Curve">
				<CoppockChart data={coppockChartData.slice(-20)} />
			</ChartContainer>
		</>
	)
}

render(<App />, document.getElementById('app'))
