import * as React from 'react'
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	ZAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts'
import { color } from '../styles/variables'

interface PriceChartProps {
	data: Array<{ time: string; price: number }>
}

const PriceChart = ({ data }: PriceChartProps): JSX.Element => {
	return (
		<ResponsiveContainer width="100%" height={300}>
			<LineChart
				data={data}
				margin={{
					top: 5,
					right: 10,
					left: -20,
					bottom: 5,
				}}
			>
				<CartesianGrid strokeDasharray="0" stroke="rgba(255, 255, 255, 0.1)" />
				<XAxis dataKey="time" />
				<YAxis type="number" domain={['auto', 'auto']} />
				<ZAxis range={[200]} />
				<Line
					type="monotone"
					name="Price"
					dataKey="price"
					stroke={`${color.light}`}
					activeDot={{ r: 4 }}
				/>
				<Tooltip
					cursor={false}
					contentStyle={{
						color: color.light,
						backgroundColor: 'rgba(255, 255, 255, 0.1)',
						border: 'none',
					}}
				/>
			</LineChart>
		</ResponsiveContainer>
	)
}

export default PriceChart
