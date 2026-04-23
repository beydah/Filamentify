import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import db from "./db.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

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
  const { categoryId, color, price, gram, purchaseDate } = req.body
  
  // Available_Gram starts as Gram
  const available_gram = gram
  
  const info = db.prepare(`
    INSERT INTO Filament_TB (CategoryID, Color, Price, Gram, Available_Gram, PurchaseDate) 
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(categoryId, color, price, gram, available_gram, purchaseDate)
  
  res.status(201).json({ 
    ID: info.lastInsertRowid, 
    CategoryID: categoryId,
    Color: color, 
    Price: price, 
    Gram: gram, 
    Available_Gram: available_gram,
    PurchaseDate: purchaseDate
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
