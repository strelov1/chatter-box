class IoCContainer {
    constructor() {
        this.services = {};
    }

    register(name, definition, dependencies) {
        this.services[name] = { definition, dependencies, instance: null };
        return this;
    }

    get(name) {
        const service = this.services[name];

        if (!service) {
            throw new Error(`Service ${name} not found`);
        }

        if (!service.instance) {
            const args = service.dependencies.map(dep => this.get(dep));
            service.instance = service.definition(...args);
        }

        return service.instance;
    }
}

module.exports.IoCContainer = IoCContainer;