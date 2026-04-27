import Database from "better-sqlite3"
import { config } from "./config.js"
import { ensureStorage } from "./security.js"

ensureStorage()

const db = new Database(config.databasePath)

db.pragma("journal_mode = WAL")
db.pragma("foreign_keys = ON")

db.exec(`
  CREATE TABLE IF NOT EXISTS Category_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE COLLATE NOCASE
  );

  CREATE TABLE IF NOT EXISTS Filament_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    CategoryID INTEGER,
    Name TEXT NOT NULL,
    Color TEXT NOT NULL,
    Price REAL NOT NULL,
    Gram INTEGER NOT NULL,
    Available_Gram INTEGER NOT NULL,
    PurchaseDate TEXT NOT NULL,
    Status TEXT DEFAULT 'Active',
    Refresh_Day TEXT DEFAULT CURRENT_TIMESTAMP,
    Score INTEGER DEFAULT 0,
    Link TEXT,
    FOREIGN KEY (CategoryID) REFERENCES Category_TB(ID) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS ModelCategory_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE COLLATE NOCASE
  );

  CREATE TABLE IF NOT EXISTS Model_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    CategoryID INTEGER,
    Name TEXT NOT NULL,
    Link TEXT,
    Gram REAL NOT NULL,
    FilePath TEXT,
    PieceCount INTEGER DEFAULT 1,
    PurchaseDate TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CategoryID) REFERENCES ModelCategory_TB(ID) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS MaterialCategory_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE COLLATE NOCASE
  );

  CREATE TABLE IF NOT EXISTS Material_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    CategoryID INTEGER,
    Name TEXT NOT NULL,
    Quantity INTEGER DEFAULT 1,
    TotalPrice REAL DEFAULT 0,
    Link TEXT,
    PurchaseDate TEXT DEFAULT CURRENT_TIMESTAMP,
    UsagePerUnit INTEGER DEFAULT 0,
    FOREIGN KEY (CategoryID) REFERENCES MaterialCategory_TB(ID) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS ProductCategory_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE COLLATE NOCASE
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
    PurchaseDate TEXT DEFAULT CURRENT_TIMESTAMP,
    ParentID INTEGER,
    CategoryID INTEGER,
    FOREIGN KEY (ParentID) REFERENCES Product_TB(ID) ON DELETE SET NULL,
    FOREIGN KEY (CategoryID) REFERENCES ProductCategory_TB(ID) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS ProductMaterials_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductID INTEGER NOT NULL,
    MaterialID INTEGER NOT NULL,
    Quantity INTEGER DEFAULT 1,
    FOREIGN KEY (ProductID) REFERENCES Product_TB(ID) ON DELETE CASCADE,
    FOREIGN KEY (MaterialID) REFERENCES Material_TB(ID)
  );

  CREATE TABLE IF NOT EXISTS ProductModels_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductID INTEGER NOT NULL,
    ModelID INTEGER NOT NULL,
    Quantity INTEGER DEFAULT 1,
    FOREIGN KEY (ProductID) REFERENCES Product_TB(ID) ON DELETE CASCADE,
    FOREIGN KEY (ModelID) REFERENCES Model_TB(ID)
  );

  CREATE TABLE IF NOT EXISTS ProductFilaments_TB (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductID INTEGER NOT NULL,
    FilamentID INTEGER NOT NULL,
    Quantity INTEGER DEFAULT 1,
    FOREIGN KEY (ProductID) REFERENCES Product_TB(ID) ON DELETE CASCADE,
    FOREIGN KEY (FilamentID) REFERENCES Filament_TB(ID)
  );

  CREATE INDEX IF NOT EXISTS idx_filament_category ON Filament_TB(CategoryID);
  CREATE INDEX IF NOT EXISTS idx_model_category ON Model_TB(CategoryID);
  CREATE INDEX IF NOT EXISTS idx_material_category ON Material_TB(CategoryID);
  CREATE INDEX IF NOT EXISTS idx_product_category ON Product_TB(CategoryID);
  CREATE INDEX IF NOT EXISTS idx_product_parent ON Product_TB(ParentID);
`)

interface TableColumn {
  name: string
}

function hasColumn(tableName: string, columnName: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as TableColumn[]
  return columns.some((column) => column.name === columnName)
}

function migrate() {
  if (!hasColumn("Filament_TB", "Link")) {
    db.exec("ALTER TABLE Filament_TB ADD COLUMN Link TEXT")
  }

  if (!hasColumn("Material_TB", "UsagePerUnit")) {
    db.exec("ALTER TABLE Material_TB ADD COLUMN UsagePerUnit INTEGER DEFAULT 0")
  }

  if (!hasColumn("Product_TB", "ImageFront")) {
    db.exec("ALTER TABLE Product_TB ADD COLUMN ImageFront TEXT")
  }

  if (!hasColumn("Product_TB", "ImageBack")) {
    db.exec("ALTER TABLE Product_TB ADD COLUMN ImageBack TEXT")
  }

  if (!hasColumn("Product_TB", "ProfitMultiplier")) {
    db.exec("ALTER TABLE Product_TB ADD COLUMN ProfitMultiplier REAL DEFAULT 1.0")
  }

  if (!hasColumn("Product_TB", "ParentID")) {
    db.exec("ALTER TABLE Product_TB ADD COLUMN ParentID INTEGER")
  }

  if (!hasColumn("Product_TB", "CategoryID")) {
    db.exec("ALTER TABLE Product_TB ADD COLUMN CategoryID INTEGER")
  }
}

migrate()

export function closeDatabase() {
  if (db.open) {
    db.close()
  }
}

export default db
