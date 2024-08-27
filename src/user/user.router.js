const userRouter = (router, container) => {
    /** @type {UserService} */
    const userService = container.get('UserService');

    router.post('/register', async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        try {
            const user = await userService.register(username, password);
            return res.status(201).json({ message: 'User registered successfully', userId: user._id });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    });

    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        try {
            const authKey = await userService.authenticate(username, password);
            return res.json({ authKey });
        } catch (error) {
            return res.status(401).json({ error: error.message });
        }
    });

    return router;
}

module.exports.userRouter = userRouter;