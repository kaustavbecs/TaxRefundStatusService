const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

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