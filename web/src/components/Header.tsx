import * as React from 'react'
import styled from 'styled-components'

const Header = (): JSX.Element => {
	return (
		<Section>
			<HeaderSection>
				<HeaderContainer>
					<h1>Crypto Bot | Charts</h1>
				</HeaderContainer>
			</HeaderSection>
		</Section>
	)
}

export default Header

const Section = styled.section`
	display: flex;
	justify-content: center;
	width: 100%;
`

const HeaderSection = styled.div`
	max-width: 1600px;
	overflow: hidden;
	padding: 0 max(4rem, env(safe-area-inset-left));
	padding-bottom: 5em;
	width: 100%;
	@media screen and (max-width: 768px) {
		padding: 0 2.5em;
		padding-bottom: 5em;
	}
`

const HeaderContainer = styled.div`
	margin-top: 2em;
	width: 100%;
	h1 {
		font-size: clamp(2.5rem, 2.8vw, 3.2rem);
	}
`
