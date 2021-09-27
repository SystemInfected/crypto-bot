import * as React from 'react'
import {
	ComposedChart,
	Line,
	Scatter,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts'
import { color } from '../styles/variables'

interface PriceChartProps {
	data: Array<{ time: string; price: number; buySell?: string }>
}

const PriceChart = ({ data }: PriceChartProps): JSX.Element => {
	return (
		<ResponsiveContainer width="100%" height={300}>
			<ComposedChart
				data={data}
				margin={{
					top: 5,
					right: 0,
					left: -20,
					bottom: 5,
				}}
			>
				<CartesianGrid strokeDasharray="0" stroke="rgba(255, 255, 255, 0.1)" />
				<XAxis dataKey="time" />
				<YAxis />
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
					name="Price"
					dataKey="price"
					stroke={`${color.light}`}
					activeDot={{ r: 4 }}
				/>
				<Scatter name="Action" dataKey="buySell" fill={color.light} />
			</ComposedChart>
		</ResponsiveContainer>
	)
}

export default PriceChart
