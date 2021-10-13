import configData from '../data/config.json'
import configSchema from '../data/schema.config.json'
import { GlobalConfig } from '../components/Interfaces'
import { logError } from './Logger'
import Ajv from 'ajv'
const ajv = new Ajv()

const validate = ajv.compile<GlobalConfig>(configSchema)

const globalConfig: GlobalConfig = configData

const emptyConfig: GlobalConfig = {
	coin: {
		shortName: '',
		longName: '',
		fullName: '',
	},
	stableCoin: {
		shortName: '',
		longName: '',
		fullName: '',
	},
	allocation: 0,
	tickInterval: 0,
	concurrentOrders: 0,
	minInitialValues: 0,
	minAlgorithmValues: 0,
	longROC: 0,
	shortROC: 0,
	WMA: 0,
	buyBuffer: 0,
	falsePositiveBuffer: 0,
	sellBuffer: 0,
	ATRmultiplier: 0,
}

const validateConfig = (): GlobalConfig => {
	if (validate(globalConfig)) {
		return globalConfig
	} else {
		logError(validate.errors)
		return emptyConfig
	}
}

export const config: GlobalConfig = validateConfig()
