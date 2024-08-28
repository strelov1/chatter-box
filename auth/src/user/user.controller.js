class UserController {
    constructor(userService, logger) {
        /** @type {UserService} */
        this.userService = userService;
        this.logger = logger;
    }

    async register(req, res) {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        try {
            const user = await this.userService.register(username, password);
            return res.status(201).json({
                message: 'User registered successfully',
                userId: user._id,
                userName: username,
            });
        } catch (error) {
            this.logger.error(error);
            return res.status(400).json({ error: error.message });
        }
    }

    async login(req, res) {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        try {
            const authKey = await this.userService.authenticate(username, password);
            return res.json({ authKey });
        } catch (error) {
            this.logger.error(error);
            return res.status(401).json({ error: error.message });
        }
    }
}

module.exports.UserController = UserController;