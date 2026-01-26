"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./src/lib/database");
async function test() {
    try {
        console.log('Initializing Database...');
        await database_1.Database.init();
        console.log('Database initialized successfully.');
        process.exit(0);
    }
    catch (err) {
        console.error('Failed:', err);
        process.exit(1);
    }
}
test();
