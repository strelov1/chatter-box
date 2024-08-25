const userRouter = (router, container) => {
    /** @type {UserService} */
    const userService = container.get('UserService');

    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        try {
            const authKey = userService.generateAuthKey();
            return res.json({ authKey });
        } catch (error) {
            return res.status(401).json({ error: error.message });
        }
    });

    return router;
}

module.exports.userRouter = userRouter;