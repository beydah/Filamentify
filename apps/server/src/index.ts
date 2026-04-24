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
    if (ext === ".stl" || ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp") {
      cb(null, true)
    } else {
      cb(new Error("File type not allowed"))
    }
  }
})

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Filamentify API" })
})

app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", time: Date.now() })
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
    INSERT INTO Filament_TB (CategoryID, Name, Color, Price, Gram, Available_Gram, PurchaseDate, Link) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(categoryId, name, color, price, gram, available_gram, purchaseDate, req.body.link)
  
  res.status(201).json({ 
    ID: info.lastInsertRowid, 
    CategoryID: categoryId,
    Name: name,
    Color: color, 
    Price: price, 
    Gram: gram, 
    Available_Gram: available_gram,
    PurchaseDate: purchaseDate,
    Link: req.body.link
  })
})

app.patch("/api/filaments/:id", (req, res) => {
  const { id } = req.params
  const { categoryId, price, gram, purchaseDate } = req.body
  try {
    // Basic validation
    if (price < 0 || gram < 50 || gram > 5000) {
      return res.status(400).json({ error: "Invalid filament data" })
    }

    db.prepare(`
      UPDATE Filament_TB 
      SET CategoryID = ?, Price = ?, Gram = ?, PurchaseDate = ?, Available_Gram = ?, Link = ?
      WHERE ID = ?
    `).run(categoryId, price, gram, purchaseDate, gram, req.body.link, id)
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

app.patch("/api/materials/:id", (req, res) => {
  const { id } = req.params
  const { categoryId, name, quantity, totalPrice, link } = req.body
  try {
    db.prepare(`
      UPDATE Material_TB 
      SET CategoryID = ?, Name = ?, Quantity = ?, TotalPrice = ?, Link = ?
      WHERE ID = ?
    `).run(categoryId, name, quantity, totalPrice, link, id)
    res.json({ message: "Material updated successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to update material" })
  }
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

// Product Category Endpoints
app.get("/api/product-categories", (req, res) => {
  const categories = db.prepare("SELECT * FROM ProductCategory_TB").all()
  res.json(categories)
})

app.post("/api/product-categories", (req, res) => {
  const { name } = req.body
  try {
    const info = db.prepare("INSERT INTO ProductCategory_TB (Name) VALUES (?)").run(name)
    res.status(201).json({ ID: info.lastInsertRowid, Name: name })
  } catch (error) {
    res.status(400).json({ error: "Product category already exists or invalid data" })
  }
})

app.delete("/api/product-categories/:id", (req, res) => {
  const { id } = req.params
  try {
    const usage = db.prepare("SELECT COUNT(*) as count FROM Product_TB WHERE CategoryID = ?").get(id) as { count: number }
    if (usage.count > 0) {
      return res.status(400).json({ error: "Category is in use and cannot be deleted" })
    }
    db.prepare("DELETE FROM ProductCategory_TB WHERE ID = ?").run(id)
    res.json({ message: "Product category deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete product category" })
  }
})

// Product Endpoints
app.get("/api/products", (req, res) => {
  const products = db.prepare(`
    SELECT p.*, c.Name as CategoryName 
    FROM Product_TB p
    LEFT JOIN ProductCategory_TB c ON p.CategoryID = c.ID
  `).all() as any[]
  
  // Fetch materials and models for each product
  const productsWithDetails = products.map(p => {
    const materials = db.prepare(`
      SELECT pm.*, m.Name 
      FROM ProductMaterials_TB pm
      JOIN Material_TB m ON pm.MaterialID = m.ID
      WHERE pm.ProductID = ?
    `).all(p.ID)
    
    const models = db.prepare(`
      SELECT pm.*, m.Name 
      FROM ProductModels_TB pm
      JOIN Model_TB m ON pm.ModelID = m.ID
      WHERE pm.ProductID = ?
    `).all(p.ID)
    
    const filaments = db.prepare(`
      SELECT pf.*, f.Name 
      FROM ProductFilaments_TB pf
      JOIN Filament_TB f ON pf.FilamentID = f.ID
      WHERE pf.ProductID = ?
    `).all(p.ID)
    
    return { ...p, materials, models, filaments }
  })
  
  res.json(productsWithDetails)
})

app.post("/api/products", upload.fields([{ name: 'imageFront', maxCount: 1 }, { name: 'imageBack', maxCount: 1 }]), (req, res) => {
  const { name, description, price, stock, profitMultiplier, materials, models, filaments, parentId, categoryId } = req.body
  const files = req.files as { [fieldname: string]: Express.Multer.File[] }
  
  const imageFront = files['imageFront'] ? files['imageFront'][0].path.replace(/\\/g, "/") : null
  const imageBack = files['imageBack'] ? files['imageBack'][0].path.replace(/\\/g, "/") : null

  try {
    const insertProduct = db.prepare(`
      INSERT INTO Product_TB (Name, Description, Price, Stock, ImageFront, ImageBack, ProfitMultiplier, ParentID, CategoryID) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const info = insertProduct.run(name, description, price, stock, imageFront, imageBack, profitMultiplier || 1.0, parentId || null, categoryId || null)
    const productId = info.lastInsertRowid

    // Insert materials
    if (materials) {
      const mats = JSON.parse(materials)
      const insertMat = db.prepare("INSERT INTO ProductMaterials_TB (ProductID, MaterialID, Quantity) VALUES (?, ?, ?)")
      mats.forEach((m: any) => insertMat.run(productId, m.id, m.quantity))
    }

    // Insert models
    if (models) {
      const mods = JSON.parse(models)
      const insertMod = db.prepare("INSERT INTO ProductModels_TB (ProductID, ModelID, Quantity) VALUES (?, ?, ?)")
      mods.forEach((m: any) => insertMod.run(productId, m.id, m.quantity))
    }

    // Insert filaments
    if (filaments) {
      const fils = JSON.parse(filaments)
      const insertFil = db.prepare("INSERT INTO ProductFilaments_TB (ProductID, FilamentID, Quantity) VALUES (?, ?, ?)")
      fils.forEach((f: any) => insertFil.run(productId, f.id, f.quantity))
    }

    res.status(201).json({ ID: productId })
  } catch (error) {
    console.error(error)
    res.status(400).json({ error: "Failed to create product" })
  }
})

app.patch("/api/products/:id", upload.fields([{ name: 'imageFront', maxCount: 1 }, { name: 'imageBack', maxCount: 1 }]), (req, res) => {
  const { id } = req.params
  const { name, description, price, stock, profitMultiplier, materials, models, filaments, parentId, categoryId } = req.body
  const files = req.files as { [fieldname: string]: Express.Multer.File[] }

  try {
    const current = db.prepare("SELECT ImageFront, ImageBack FROM Product_TB WHERE ID = ?").get(id) as any
    
    const imageFront = files['imageFront'] ? files['imageFront'][0].path.replace(/\\/g, "/") : current.ImageFront
    const imageBack = files['imageBack'] ? files['imageBack'][0].path.replace(/\\/g, "/") : current.ImageBack

    // Delete old files if new ones uploaded
    if (files['imageFront'] && current.ImageFront && fs.existsSync(current.ImageFront)) fs.unlinkSync(current.ImageFront)
    if (files['imageBack'] && current.ImageBack && fs.existsSync(current.ImageBack)) fs.unlinkSync(current.ImageBack)

    db.prepare(`
      UPDATE Product_TB 
      SET Name = ?, Description = ?, Price = ?, Stock = ?, ImageFront = ?, ImageBack = ?, ProfitMultiplier = ?, ParentID = ?, CategoryID = ?
      WHERE ID = ?
    `).run(name, description, price, stock, imageFront, imageBack, profitMultiplier || 1.0, parentId || null, categoryId || null, id)

    // Update materials (clear and re-insert)
    if (materials) {
      db.prepare("DELETE FROM ProductMaterials_TB WHERE ProductID = ?").run(id)
      const mats = JSON.parse(materials)
      const insertMat = db.prepare("INSERT INTO ProductMaterials_TB (ProductID, MaterialID, Quantity) VALUES (?, ?, ?)")
      mats.forEach((m: any) => insertMat.run(id, m.id, m.quantity))
    }

    // Update models
    if (models) {
      db.prepare("DELETE FROM ProductModels_TB WHERE ProductID = ?").run(id)
      const mods = JSON.parse(models)
      const insertMod = db.prepare("INSERT INTO ProductModels_TB (ProductID, ModelID, Quantity) VALUES (?, ?, ?)")
      mods.forEach((m: any) => insertMod.run(id, m.id, m.quantity))
    }

    // Update filaments
    if (filaments) {
      db.prepare("DELETE FROM ProductFilaments_TB WHERE ProductID = ?").run(id)
      const fils = JSON.parse(filaments)
      const insertFil = db.prepare("INSERT INTO ProductFilaments_TB (ProductID, FilamentID, Quantity) VALUES (?, ?, ?)")
      fils.forEach((f: any) => insertFil.run(id, f.id, f.quantity))
    }

    res.json({ message: "Product updated successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to update product" })
  }
})

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params
  try {
    const current = db.prepare("SELECT ImageFront, ImageBack FROM Product_TB WHERE ID = ?").get(id) as any
    if (current.ImageFront && fs.existsSync(current.ImageFront)) fs.unlinkSync(current.ImageFront)
    if (current.ImageBack && fs.existsSync(current.ImageBack)) fs.unlinkSync(current.ImageBack)
    
    db.prepare("DELETE FROM Product_TB WHERE ID = ?").run(id)
    res.json({ message: "Product deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete product" })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
