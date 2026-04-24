import Database from "better-sqlite3"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.resolve(__dirname, "../Filamentify_DB.sqlite")
const db = new Database(dbPath)

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS Category_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS Filament_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    CategoryID INTEGER,
    Name TEXT,
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

  CREATE TABLE IF NOT EXISTS ModelCategory_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS Model_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    CategoryID INTEGER,
    Name TEXT NOT NULL,
    Link TEXT,
    Gram REAL NOT NULL,
    FilePath TEXT,
    PieceCount INTEGER DEFAULT 1,
    PurchaseDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CategoryID) REFERENCES ModelCategory_TB(ID)
  );

  CREATE TABLE IF NOT EXISTS MaterialCategory_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS Material_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    CategoryID INTEGER,
    Name TEXT NOT NULL,
    Quantity INTEGER DEFAULT 1,
    TotalPrice REAL DEFAULT 0,
    Link TEXT,
    PurchaseDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CategoryID) REFERENCES MaterialCategory_TB(ID)
  );

  CREATE TABLE IF NOT EXISTS Product_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Description TEXT,
    Price REAL NOT NULL,
    Stock INTEGER DEFAULT 0,
    ImageFront TEXT,
    ImageBack TEXT,
    ProfitMultiplier REAL DEFAULT 1.0,
    PurchaseDate DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ProductMaterials_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductID INTEGER,
    MaterialID INTEGER,
    Quantity INTEGER DEFAULT 1,
    FOREIGN KEY (ProductID) REFERENCES Product_TB(ID) ON DELETE CASCADE,
    FOREIGN KEY (MaterialID) REFERENCES Material_TB(ID)
  );

  CREATE TABLE IF NOT EXISTS ProductModels_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductID INTEGER,
    ModelID INTEGER,
    Quantity INTEGER DEFAULT 1,
    FOREIGN KEY (ProductID) REFERENCES Product_TB(ID) ON DELETE CASCADE,
    FOREIGN KEY (ModelID) REFERENCES Model_TB(ID)
  );

  -- Migration for existing Product_TB if any
  PRAGMA table_info(Product_TB);
`)

interface TableColumn {
  name: string
}

// Migration checks
const filamentInfo = db.prepare("PRAGMA table_info(Filament_TB)").all() as TableColumn[]
if (!filamentInfo.find(col => col.name === "Name")) {
  db.exec("ALTER TABLE Filament_TB ADD COLUMN Name TEXT")
}

const modelInfo = db.prepare("PRAGMA table_info(Model_TB)").all() as TableColumn[]
if (!modelInfo.find(col => col.name === "FilePath")) {
  db.exec("ALTER TABLE Model_TB ADD COLUMN FilePath TEXT")
}

if (!modelInfo.find(col => col.name === "PieceCount")) {
  db.exec("ALTER TABLE Model_TB ADD COLUMN PieceCount INTEGER DEFAULT 1")
}

const productInfo = db.prepare("PRAGMA table_info(Product_TB)").all() as TableColumn[]
if (!productInfo.find(col => col.name === "ImageFront")) {
  db.exec("ALTER TABLE Product_TB ADD COLUMN ImageFront TEXT")
}
if (!productInfo.find(col => col.name === "ImageBack")) {
  db.exec("ALTER TABLE Product_TB ADD COLUMN ImageBack TEXT")
}
if (!productInfo.find(col => col.name === "ProfitMultiplier")) {
  db.exec("ALTER TABLE Product_TB ADD COLUMN ProfitMultiplier REAL DEFAULT 1.0")
}

export default db
