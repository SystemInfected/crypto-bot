import * as React from 'react'
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	ResponsiveContainer,
} from 'recharts'
import { color } from '../styles/variables'

interface PriceChartProps {
	data: Array<{ time: string; coppockValue: number }>
}

const PriceChart = ({ data }: PriceChartProps): JSX.Element => {
	return (
		<ResponsiveContainer width="100%" height={150}>
			<LineChart
				data={data}
				margin={{
					top: 5,
					right: 0,
					left: -20,
					bottom: 5,
				}}
			>
				<CartesianGrid strokeDasharray="0" stroke="rgba(255, 255, 255, 0.1)" />
				<XAxis dataKey="name" />
				<YAxis />

				<Line
					type="monotone"
					dataKey="coppockValue"
					stroke={`${color.light}`}
					dot={false}
				/>
			</LineChart>
		</ResponsiveContainer>
	)
}

export default PriceChart
