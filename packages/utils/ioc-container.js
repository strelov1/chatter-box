class IoCContainer {
	constructor() {
		this._registry = new Map();
		this._singletons = new Map();
	}

	register(token, factory, dependencies = []) {
		this._registry.set(token, { factory, dependencies });
	}

	registerValue(token, value) {
		this._singletons.set(token, value);
	}

	registerMultiple(services) {
		for (const service of services) {
			const {
				token,
				useClass,
				useValue,
				useFactory,
				dependencies = [],
			} = service;

			if (useClass) {
				this.register(
					token,
					() => new useClass(...dependencies.map((dep) => this.get(dep))),
					dependencies,
				);
			} else if (useValue !== undefined) {
				this.registerValue(token, useValue);
			} else if (useFactory) {
				this.register(
					token,
					() => useFactory(...dependencies.map((dep) => this.get(dep))),
					dependencies,
				);
			}
		}
	}

	get(token) {
		if (this._singletons.has(token)) {
			return this._singletons.get(token);
		}

		const entry = this._registry.get(token);
		if (!entry) {
			throw new Error(`Dependency not found: ${token}`);
		}

		const { factory, dependencies } = entry;
		const dependencyInstances = dependencies.map((dep) => this.get(dep));

		const instance = factory(...dependencyInstances);

		if (typeof instance === "object" && instance !== null) {
			this._singletons.set(token, instance);
		}

		return instance;
	}
}

const createIoCContainer = () => {
	return new IoCContainer();
};

module.exports = {
	IoCContainer,
	createIoCContainer,
};
