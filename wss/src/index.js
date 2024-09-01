const app = require('./app');


async function main() {
    try {
        await app();
    } catch(error) {
        console.error(error);
        process.exit(1)
    }
}

main();