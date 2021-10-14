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
	ErrorBar,
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
		if (d.price.close > d.price.open) {
			return {
				time: d.time,
				average: d.price.average,
				openClose: [d.price.open, d.price.close],
				greenCandle: [
					d.price.close - d.price.low,
					d.price.high - d.price.close,
				],
			}
		}
		return {
			time: d.time,
			average: d.price.average,
			openClose: [d.price.close, d.price.open],
			redCandle: [d.price.open - d.price.low, d.price.high - d.price.open],
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
				<XAxis xAxisId="candle1" dataKey="time" />
				<XAxis xAxisId="candle2" dataKey="time" hide />
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
					xAxisId="candle1"
					type="monotone"
					name="Average price"
					dataKey="average"
					stroke={`${color.light}`}
					activeDot={{ r: 4 }}
				/>
				<Bar
					xAxisId="candle1"
					name="Open / Close"
					dataKey="openClose"
					fill={color.light}
					style={{ opacity: 0.15 }}
				>
					<ErrorBar
						dataKey="greenCandle"
						stroke={color.green}
						style={{ opacity: 0.6 }}
					/>
					<ErrorBar
						dataKey="redCandle"
						stroke={color.red}
						style={{ opacity: 0.6 }}
					/>
				</Bar>
			</ComposedChart>
		</ResponsiveContainer>
	)
}

export default PriceChart
