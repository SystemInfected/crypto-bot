import { ping } from './components/CryptoData'
import { logError, logInfo, logSuccess } from './utils/Logger'
require('dotenv').config()

ping()
	.then((data) => {
		logInfo(data)
	})
	.catch((err) => logError(err))

logSuccess('Yes!')
logError('No!')
