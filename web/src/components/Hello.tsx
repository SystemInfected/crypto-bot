import * as React from 'react'

export interface HelloProps {
	what: string
}

export const Hello = ({ what }: HelloProps): JSX.Element => {
	return <h1>Hello {what}</h1>
}
