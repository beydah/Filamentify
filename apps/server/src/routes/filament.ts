import { Router } from "express"
import db from "../db.js"
import {
  asyncHandler,
  notFound,
  parseId,
  parseIsoDate,
  parseNumberField,
  parseOptionalString,
  parseStringField,
  sendCreated,
} from "../http.js"
import { registerCategoryRoutes } from "./category-factory.js"

const filamentRouter = Router()

registerCategoryRoutes(filamentRouter, {
  categoryTable: "Category_TB",
  itemTable: "Filament_TB",
  route: "categories",
  entityName: "Filament",
})

filamentRouter.get(
  "/api/filaments",
  asyncHandler((req, res) => {
    void req
    const filaments = db
      .prepare(`
        SELECT f.*, c.Name AS CategoryName
        FROM Filament_TB f
        LEFT JOIN Category_TB c ON c.ID = f.CategoryID
        ORDER BY f.ID DESC
      `)
      .all()

    res.json(filaments)
  }),
)

filamentRouter.post(
  "/api/filaments",
  asyncHandler((req, res) => {
    const categoryId = parseId(req.body.categoryId, "categoryId")
    const name = parseStringField(req.body.name, "name", { maxLength: 120 })
    const color = parseStringField(req.body.color, "color", { maxLength: 32 })
    const price = parseNumberField(req.body.price, "price", { min: 0 })
    const gram = parseNumberField(req.body.gram, "gram", { integer: true, min: 50, max: 5000 })
    const purchaseDate = parseIsoDate(req.body.purchaseDate, "purchaseDate")
    const link = parseOptionalString(req.body.link, "link")

    const info = db
      .prepare(`
        INSERT INTO Filament_TB (CategoryID, Name, Color, Price, Gram, Available_Gram, PurchaseDate, Link)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(categoryId, name, color, price, gram, gram, purchaseDate, link)

    sendCreated(res, {
      ID: info.lastInsertRowid,
      CategoryID: categoryId,
      Name: name,
      Color: color,
      Price: price,
      Gram: gram,
      Available_Gram: gram,
      PurchaseDate: purchaseDate,
      Link: link,
    })
  }),
)

filamentRouter.patch(
  "/api/filaments/:id",
  asyncHandler((req, res) => {
    const id = parseId(req.params.id)
    const current = db.prepare("SELECT * FROM Filament_TB WHERE ID = ?").get(id) as
      | {
          ID: number
          Available_Gram: number
        }
      | undefined

    if (!current) {
      notFound("Filament was not found")
    }

    const categoryId = parseId(req.body.categoryId, "categoryId")
    const name = parseStringField(req.body.name, "name", { maxLength: 120 })
    const color = parseStringField(req.body.color, "color", { maxLength: 32 })
    const price = parseNumberField(req.body.price, "price", { min: 0 })
    const gram = parseNumberField(req.body.gram, "gram", { integer: true, min: 50, max: 5000 })
    const purchaseDate = parseIsoDate(req.body.purchaseDate, "purchaseDate")
    const link = parseOptionalString(req.body.link, "link")
    const availableGram =
      req.body.availableGram !== undefined && req.body.availableGram !== ""
        ? parseNumberField(req.body.availableGram, "availableGram", { integer: true, min: 0, max: gram })
        : req.body.resetAvailableGram
          ? gram
          : current.Available_Gram

    const info = db
      .prepare(`
        UPDATE Filament_TB
        SET CategoryID = ?, Name = ?, Color = ?, Price = ?, Gram = ?, Available_Gram = ?, PurchaseDate = ?, Link = ?
        WHERE ID = ?
      `)
      .run(categoryId, name, color, price, gram, availableGram, purchaseDate, link, id)

    if (info.changes === 0) {
      notFound("Filament was not found")
    }

    res.json({ message: "Filament updated successfully" })
  }),
)

filamentRouter.delete(
  "/api/filaments/:id",
  asyncHandler((req, res) => {
    const id = parseId(req.params.id)
    const info = db.prepare("DELETE FROM Filament_TB WHERE ID = ?").run(id)
    if (info.changes === 0) {
      notFound("Filament was not found")
    }

    res.json({ message: "Filament deleted successfully" })
  }),
)

export { filamentRouter }
