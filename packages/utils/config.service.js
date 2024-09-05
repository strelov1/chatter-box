class ConfigService {
	constructor() {
		this.config = {};
	}

	get(key, defaultValue) {
		const value = process.env[key]
		if (!value) {
			if (defaultValue) {
				return defaultValue;
			}
			throw new Error(`ENV param: ${key} is not defined`)
		}
		console.log(`Retrieved config param: ${key} with value: ${value}`)
		return value;
	}
}

module.exports = {
	ConfigService
};
