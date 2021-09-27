import * as React from 'react'
import { render } from 'react-dom'
import { Hello } from './components/Hello'

const App = (): JSX.Element => {
	return (
		<div>
			<Hello what="World" />
		</div>
	)
}

render(<App />, document.getElementById('app'))
