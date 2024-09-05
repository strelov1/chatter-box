const { AbortController } = require("abort-controller");

function withTimeout(promise, timeoutDuration) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, timeoutDuration);

    return Promise.race([
        promise,
        new Promise((_, reject) => {
            controller.signal.addEventListener("abort", () => {
                reject(new Error("Operation aborted due to timeout"));
            });
        }),
    ]).finally(() => clearTimeout(timeout));
}

module.exports = {
    withTimeout,
};