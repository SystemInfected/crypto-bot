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
import styled from 'styled-components'
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any): JSX.Element | null => {
	if (active && payload && payload.length) {
		const { average, open, high, low, close } = payload[0]['payload']
		return (
			<ChartTooltip>
				<p id="average">
					<span>Average:</span>
					<span>{average.toFixed(2)}</span>
				</p>
				<p>
					<span>Open: </span>
					<span>{open}</span>
				</p>
				<p>
					<span>High: </span>
					<span>{high}</span>
				</p>
				<p>
					<span>Low: </span>
					<span>{low}</span>
				</p>
				<p>
					<span>Close:</span>
					<span>{close}</span>
				</p>
			</ChartTooltip>
		)
	}

	return null
}

const PriceChart = ({ data }: PriceChartProps): JSX.Element => {
	const chartData = data.map((d) => {
		if (d.price.close > d.price.open) {
			return {
				time: d.time,
				average: d.price.average,
				open: d.price.open,
				high: d.price.high,
				low: d.price.low,
				close: d.price.close,
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
			open: d.price.open,
			high: d.price.high,
			low: d.price.low,
			close: d.price.close,
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
				<Tooltip cursor={false} content={<CustomTooltip />} />
				<Line
					xAxisId="candle1"
					type="monotone"
					name="Average price"
					dataKey="average"
					dot={false}
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

const ChartTooltip = styled.div`
	color: ${color.light};
	background-color: rgba(255, 255, 255, 0.1);
	padding: 1em;
	width: 14em;
	p {
		display: flex;
		width: 100%;
		justify-content: space-between;
		&#average {
			margin-bottom: 1em;
		}
		span:nth-of-type(2) {
			font-weight: bold;
		}
	}
`
