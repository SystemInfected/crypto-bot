import * as React from 'react'
import {
	Line,
	XAxis,
	YAxis,
	ZAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	ComposedChart,
	Bar,
} from 'recharts'
import { color } from '../styles/variables'

interface CoinValuesProps {
	timestamp: number
	open: number
	high: number
	low: number
	close: number
	volume: number
	average: number
}

interface PriceChartProps {
	data: Array<{ time: string; price: CoinValuesProps }>
}

const PriceChart = ({ data }: PriceChartProps): JSX.Element => {
	const chartData = data.map((d) => {
		return {
			time: d.time,
			average: d.price.average,
			candle: [d.price.open, d.price.close],
		}
	})
	return (
		<ResponsiveContainer width="100%" height={300}>
			<ComposedChart
				data={chartData}
				margin={{
					top: 5,
					right: 10,
					left: -20,
					bottom: 5,
				}}
				barCategoryGap="10%"
			>
				<CartesianGrid strokeDasharray="0" stroke="rgba(255, 255, 255, 0.1)" />
				<XAxis dataKey="time" />
				<YAxis type="number" domain={['auto', 'auto']} />
				<ZAxis range={[200]} />
				<Tooltip
					cursor={false}
					contentStyle={{
						color: color.light,
						backgroundColor: 'rgba(255, 255, 255, 0.1)',
						border: 'none',
					}}
				/>
				<Line
					type="monotone"
					name="Average price"
					dataKey="average"
					stroke={`${color.light}`}
					activeDot={{ r: 4 }}
				/>
				<Bar
					name="Open/Close"
					dataKey="candle"
					fill={color.light}
					style={{ opacity: 0.15 }}
				/>
			</ComposedChart>
		</ResponsiveContainer>
	)
}

export default PriceChart
