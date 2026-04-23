import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import fs from "fs"
import multer from "multer"
import db from "./db.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static("uploads"))

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext === ".stl") {
      cb(null, true)
    } else {
      cb(new Error("Only .stl files are allowed"))
    }
  }
})

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Filamentify API" })
})

// Category Endpoints
app.get("/api/categories", (req, res) => {
  const categories = db.prepare("SELECT * FROM Category_TB").all()
  res.json(categories)
})

app.post("/api/categories", (req, res) => {
  const { name } = req.body
  try {
    const info = db.prepare("INSERT INTO Category_TB (Name) VALUES (?)").run(name)
    res.status(201).json({ ID: info.lastInsertRowid, Name: name })
  } catch (error) {
    res.status(400).json({ error: "Category already exists or invalid data" })
  }
})

app.delete("/api/categories/:id", (req, res) => {
  const { id } = req.params
  try {
    // Check if category is used by any filament
    const usage = db.prepare("SELECT COUNT(*) as count FROM Filament_TB WHERE CategoryID = ?").get(id) as { count: number }
    if (usage.count > 0) {
      return res.status(400).json({ error: "Category is in use and cannot be deleted" })
    }
    db.prepare("DELETE FROM Category_TB WHERE ID = ?").run(id)
    res.json({ message: "Category deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete category" })
  }
})

// Filament Endpoints
app.get("/api/filaments", (req, res) => {
  const filaments = db.prepare(`
    SELECT f.*, c.Name as CategoryName 
    FROM Filament_TB f
    LEFT JOIN Category_TB c ON f.CategoryID = c.ID
  `).all()
  res.json(filaments)
})

app.post("/api/filaments", (req, res) => {
  const { categoryId, name, color, price, gram, purchaseDate } = req.body
  
  // Basic validation
  if (!categoryId || !name || price < 0 || gram < 50 || gram > 5000) {
    return res.status(400).json({ error: "Invalid filament data" })
  }

  // Available_Gram starts as Gram
  const available_gram = gram
  
  const info = db.prepare(`
    INSERT INTO Filament_TB (CategoryID, Name, Color, Price, Gram, Available_Gram, PurchaseDate) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(categoryId, name, color, price, gram, available_gram, purchaseDate)
  
  res.status(201).json({ 
    ID: info.lastInsertRowid, 
    CategoryID: categoryId,
    Name: name,
    Color: color, 
    Price: price, 
    Gram: gram, 
    Available_Gram: available_gram,
    PurchaseDate: purchaseDate
  })
})

app.patch("/api/filaments/:id", (req, res) => {
  const { id } = req.params
  const { price, gram, purchaseDate } = req.body
  try {
    // Basic validation
    if (price < 0 || gram < 50 || gram > 5000) {
      return res.status(400).json({ error: "Invalid filament data" })
    }

    db.prepare(`
      UPDATE Filament_TB 
      SET Price = ?, Gram = ?, PurchaseDate = ?, Available_Gram = ?
      WHERE ID = ?
    `).run(price, gram, purchaseDate, gram, id) // Assuming editing gram resets available gram for simplicity or we should adjust proportionally. 
                                                // User asked to edit gram, usually it means correcting the total.
    res.json({ message: "Filament updated successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to update filament" })
  }
})

app.delete("/api/filaments/:id", (req, res) => {
  const { id } = req.params
  try {
    db.prepare("DELETE FROM Filament_TB WHERE ID = ?").run(id)
    res.json({ message: "Filament deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete filament" })
  }
})

// Model Category Endpoints
app.get("/api/model-categories", (req, res) => {
  const categories = db.prepare("SELECT * FROM ModelCategory_TB").all()
  res.json(categories)
})

app.post("/api/model-categories", (req, res) => {
  const { name } = req.body
  try {
    const info = db.prepare("INSERT INTO ModelCategory_TB (Name) VALUES (?)").run(name)
    res.status(201).json({ ID: info.lastInsertRowid, Name: name })
  } catch (error) {
    res.status(400).json({ error: "Model category already exists or invalid data" })
  }
})

app.delete("/api/model-categories/:id", (req, res) => {
  const { id } = req.params
  try {
    const usage = db.prepare("SELECT COUNT(*) as count FROM Model_TB WHERE CategoryID = ?").get(id) as { count: number }
    if (usage.count > 0) {
      return res.status(400).json({ error: "Category is in use and cannot be deleted" })
    }
    db.prepare("DELETE FROM ModelCategory_TB WHERE ID = ?").run(id)
    res.json({ message: "Model category deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete model category" })
  }
})

// Model Endpoints
app.get("/api/models", (req, res) => {
  const models = db.prepare(`
    SELECT m.*, c.Name as CategoryName 
    FROM Model_TB m
    LEFT JOIN ModelCategory_TB c ON m.CategoryID = c.ID
  `).all()
  res.json(models)
})

app.post("/api/models", upload.single("file"), (req, res) => {
  const { categoryId, name, link, gram, pieceCount } = req.body
  const filePath = req.file ? req.file.path.replace(/\\/g, "/") : null

  if (!categoryId || !name || gram < 0) {
    return res.status(400).json({ error: "Invalid model data" })
  }
  const info = db.prepare(`
    INSERT INTO Model_TB (CategoryID, Name, Link, Gram, PieceCount, FilePath) 
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(categoryId, name, link, gram, pieceCount || 1, filePath)
  res.status(201).json({ 
    ID: info.lastInsertRowid, 
    CategoryID: categoryId,
    Name: name,
    Link: link,
    Gram: gram,
    PieceCount: pieceCount || 1,
    FilePath: filePath
  })
})

app.patch("/api/models/:id", upload.single("file"), (req, res) => {
  const { id } = req.params
  const { name, categoryId, link, gram, pieceCount } = req.body
  const newFilePath = req.file ? req.file.path.replace(/\\/g, "/") : null

  try {
    if (newFilePath) {
      // Delete old file if exists
      const old = db.prepare("SELECT FilePath FROM Model_TB WHERE ID = ?").get(id) as { FilePath: string | null }
      if (old && old.FilePath && fs.existsSync(old.FilePath)) {
        fs.unlinkSync(old.FilePath)
      }
      db.prepare(`
        UPDATE Model_TB 
        SET Name = ?, CategoryID = ?, Link = ?, Gram = ?, PieceCount = ?, FilePath = ?
        WHERE ID = ?
      `).run(name, categoryId, link, gram, pieceCount || 1, newFilePath, id)
    } else {
      db.prepare(`
        UPDATE Model_TB 
        SET Name = ?, CategoryID = ?, Link = ? , Gram = ?, PieceCount = ?
        WHERE ID = ?
      `).run(name, categoryId, link, gram, pieceCount || 1, id)
    }
    res.json({ message: "Model updated successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to update model" })
  }
})

app.delete("/api/models/:id", (req, res) => {
  const { id } = req.params
  try {
    // Delete file if exists
    const old = db.prepare("SELECT FilePath FROM Model_TB WHERE ID = ?").get(id) as { FilePath: string | null }
    if (old && old.FilePath && fs.existsSync(old.FilePath)) {
      fs.unlinkSync(old.FilePath)
    }
    db.prepare("DELETE FROM Model_TB WHERE ID = ?").run(id)
    res.json({ message: "Model deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete model" })
  }
})

// Material Category Endpoints
app.get("/api/material-categories", (req, res) => {
  const categories = db.prepare("SELECT * FROM MaterialCategory_TB").all()
  res.json(categories)
})

app.post("/api/material-categories", (req, res) => {
  const { name } = req.body
  try {
    const info = db.prepare("INSERT INTO MaterialCategory_TB (Name) VALUES (?)").run(name)
    res.status(201).json({ ID: info.lastInsertRowid, Name: name })
  } catch (error) {
    res.status(400).json({ error: "Material category already exists or invalid data" })
  }
})

app.delete("/api/material-categories/:id", (req, res) => {
  const { id } = req.params
  try {
    const usage = db.prepare("SELECT COUNT(*) as count FROM Material_TB WHERE CategoryID = ?").get(id) as { count: number }
    if (usage.count > 0) {
      return res.status(400).json({ error: "Category is in use and cannot be deleted" })
    }
    db.prepare("DELETE FROM MaterialCategory_TB WHERE ID = ?").run(id)
    res.json({ message: "Material category deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete material category" })
  }
})

// Material Endpoints
app.get("/api/materials", (req, res) => {
  const materials = db.prepare(`
    SELECT m.*, c.Name as CategoryName 
    FROM Material_TB m
    LEFT JOIN MaterialCategory_TB c ON m.CategoryID = c.ID
  `).all()
  res.json(materials)
})

app.post("/api/materials", (req, res) => {
  const { categoryId, name, quantity, totalPrice, link } = req.body
  if (!categoryId || !name || quantity < 0) {
    return res.status(400).json({ error: "Invalid material data" })
  }
  const info = db.prepare(`
    INSERT INTO Material_TB (CategoryID, Name, Quantity, TotalPrice, Link) 
    VALUES (?, ?, ?, ?, ?)
  `).run(categoryId, name, quantity, totalPrice, link)
  res.status(201).json({ 
    ID: info.lastInsertRowid, 
    CategoryID: categoryId,
    Name: name,
    Quantity: quantity,
    TotalPrice: totalPrice,
    Link: link
  })
})

app.delete("/api/materials/:id", (req, res) => {
  const { id } = req.params
  try {
    db.prepare("DELETE FROM Material_TB WHERE ID = ?").run(id)
    res.json({ message: "Material deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete material" })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
