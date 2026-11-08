import { initializeDatabase } from "../src/local-db.js";
await initializeDatabase();
console.log("Local database ready. Demo password: Password123!");
