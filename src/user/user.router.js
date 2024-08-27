const userRouter = (router, container) => {
    const userController = container.get('UserController');

    router.post('/register', userController.register.bind(userController));
    router.post('/login', userController.login.bind(userController));

    return router;
}

module.exports.userRouter = userRouter;