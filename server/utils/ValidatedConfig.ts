import configData from '../data/config.json'
import configSchema from '../data/schema.config.json'
import { GlobalConfig } from '../components/Interfaces'
import { logError } from './Logger'
import Ajv from 'ajv'
const ajv = new Ajv()

const validate = ajv.compile<GlobalConfig>(configSchema)

const globalConfig: GlobalConfig = configData

const standardConfig: GlobalConfig = {
	coin: {
		short: 'ETH',
		fullName: 'Ethereum',
	},
	stableCoin: {
		short: 'USDT',
		fullName: 'Tether',
	},
	tickInterval: 3,
	concurrentOrders: 3,
	minInitialValues: 15,
	minAlgorithmValues: 25,
	longROC: 14,
	shortROC: 11,
	WMA: 10,
	buyBuffer: 4,
	falsePositiveBuffer: 0.6,
	sellBuffer: 2,
	ATRmultiplier: 2.5,
}

const validateConfig = (): GlobalConfig => {
	if (validate(globalConfig)) {
		return globalConfig
	} else {
		logError(validate.errors)
		return standardConfig
	}
}

export const config: GlobalConfig = validateConfig()
