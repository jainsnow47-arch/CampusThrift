const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

let dbInstance = null;

function getDatabasePath() {
  if (process.env.DB_PATH && process.env.DB_PATH.trim()) {
    return path.resolve(process.cwd(), process.env.DB_PATH.trim());
  }
  return path.join(__dirname, '../database/reloop.sqlite');
}

function initDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  dbInstance = db;
  return dbInstance;
}

function getDb() {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  initDatabase,
  getDb,
  closeDatabase
};
