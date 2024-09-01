class ConfigService {
	constructor() {
		this.config = {};
	}

	get(key, defaultValue) {
		const param = process.env[key]
		if (!param) {
			if (defaultValue) {
				return defaultValue;
			}
			throw new Error(`ENV param: ${param} is not defined`)
		}
		return param;
	}
}

module.exports = {
	ConfigService
};
