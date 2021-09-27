import * as React from 'react'
import { render } from 'react-dom'
import { Hello } from './components/Hello'

const App = (): JSX.Element => {
	return (
		<div>
			<Hello what="Worlden" />
		</div>
	)
}

render(<App />, document.getElementById('app'))
