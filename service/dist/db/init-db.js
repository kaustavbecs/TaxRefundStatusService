"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3 = __importStar(require("sqlite3"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Database file path
const dbPath = path.join(__dirname, '../../db/tax_refund.db');
// SQL files
const schemaPath = path.join(__dirname, '../../db/schema.sql');
const sampleDataPath = path.join(__dirname, '../../db/sample_data.sql');
// Create database directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
// Initialize database
function initDb() {
    console.log('Initializing database...');
    // Remove existing database file if it exists
    if (fs.existsSync(dbPath)) {
        console.log('Removing existing database...');
        fs.unlinkSync(dbPath);
    }
    // Create new database
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
            process.exit(1);
        }
        console.log('Connected to the SQLite database.');
        // Read schema SQL
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        // Execute schema SQL
        db.exec(schemaSql, (err) => {
            if (err) {
                console.error('Error creating schema:', err.message);
                process.exit(1);
            }
            console.log('Database schema created successfully.');
            // Read sample data SQL
            const sampleDataSql = fs.readFileSync(sampleDataPath, 'utf8');
            // Execute sample data SQL
            db.exec(sampleDataSql, (err) => {
                if (err) {
                    console.error('Error inserting sample data:', err.message);
                    process.exit(1);
                }
                console.log('Sample data inserted successfully.');
                // Close database connection
                db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                        process.exit(1);
                    }
                    console.log('Database initialized successfully.');
                });
            });
        });
    });
}
// Run initialization
initDb();
//# sourceMappingURL=init-db.js.map