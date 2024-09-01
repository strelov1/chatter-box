const authRouter = (router, container) => {
	/** @type {AuthController} */
	const authController = container.get("AuthController");

	router.post("/register", authController.register.bind(authController));
	router.post("/login", authController.login.bind(authController));

	return router;
};

module.exports = {
	authRouter,
};
