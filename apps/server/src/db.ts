import Database from "better-sqlite3"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.resolve(__dirname, "../Filamentify_DB.sqlite")
const db = new Database(dbPath, { verbose: console.log })

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS Category_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS Filament_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    CategoryID INTEGER,
    Color TEXT NOT NULL,
    Price REAL NOT NULL,
    Gram INTEGER NOT NULL,
    Available_Gram INTEGER NOT NULL,
    PurchaseDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status TEXT DEFAULT 'Active',
    Refresh_Day DATETIME DEFAULT CURRENT_TIMESTAMP,
    Score INTEGER DEFAULT 0,
    FOREIGN KEY (CategoryID) REFERENCES Category_TB(ID)
  );
`)

export default db
