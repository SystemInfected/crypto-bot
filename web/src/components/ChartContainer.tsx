import * as React from 'react'
import styled from 'styled-components'

interface ChartContainerProps {
	title: string
	children: React.ReactChild
}

const ChartContainer = ({
	title,
	children,
}: ChartContainerProps): JSX.Element => {
	return (
		<Section>
			<ChartSection>
				<TitleContainer>
					<h2>{title}</h2>
				</TitleContainer>
				<Chart>{children}</Chart>
			</ChartSection>
		</Section>
	)
}

export default ChartContainer

const Section = styled.section`
	display: flex;
	justify-content: center;
	width: 100%;
`

const ChartSection = styled.div`
	max-width: 1600px;
	overflow: hidden;
	padding: 0 max(4rem, env(safe-area-inset-left));
	padding-bottom: 3em;
	width: 100%;
	@media screen and (max-width: 768px) {
		padding: 0 2.5em;
		padding-bottom: 3em;
	}
`

const TitleContainer = styled.div`
	margin-top: 2em;
	width: 100%;
	h2 {
		font-size: clamp(1.6rem, 2vw, 2.6rem);
	}
`

const Chart = styled.div`
	margin-top: 1em;
	width: 100%;
	background-color: rgba(255, 255, 255, 0.05);
	backdrop-filter: blur(5px);
	padding: 2.5em;
	border-radius: 1.5em;
`
