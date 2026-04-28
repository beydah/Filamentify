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

const materialRouter = Router()

registerCategoryRoutes(materialRouter, {
  categoryTable: "MaterialCategory_TB",
  itemTable: "Material_TB",
  route: "material-categories",
  entityName: "Material",
})

materialRouter.get(
  "/api/materials",
  asyncHandler((req, res) => {
    void req
    const materials = db
      .prepare(`
        SELECT m.*, c.Name AS CategoryName
        FROM Material_TB m
        LEFT JOIN MaterialCategory_TB c ON c.ID = m.CategoryID
        ORDER BY m.ID DESC
      `)
      .all()

    res.json(materials)
  }),
)

materialRouter.post(
  "/api/materials",
  asyncHandler((req, res) => {
    const categoryId = parseId(req.body.categoryId, "categoryId")
    const name = parseStringField(req.body.name, "name", { maxLength: 160 })
    const quantity = parseNumberField(req.body.quantity, "quantity", { integer: true, min: 0, max: 100000 })
    const totalPrice = parseNumberField(req.body.totalPrice, "totalPrice", { min: 0 })
    const link = parseOptionalString(req.body.link, "link")
    const purchaseDate = parseIsoDate(req.body.purchaseDate, "purchaseDate")
    const usagePerUnit = parseNumberField(req.body.usagePerUnit ?? "0", "usagePerUnit", { integer: true, min: 0, max: 100000 })

    const info = db
      .prepare(`
        INSERT INTO Material_TB (CategoryID, Name, Quantity, TotalPrice, Link, PurchaseDate, UsagePerUnit)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(categoryId, name, quantity, totalPrice, link, purchaseDate, usagePerUnit)

    sendCreated(res, {
      ID: info.lastInsertRowid,
      CategoryID: categoryId,
      Name: name,
      Quantity: quantity,
      TotalPrice: totalPrice,
      Link: link,
      PurchaseDate: purchaseDate,
      UsagePerUnit: usagePerUnit,
    })
  }),
)

materialRouter.patch(
  "/api/materials/:id",
  asyncHandler((req, res) => {
    const id = parseId(req.params.id)
    const categoryId = parseId(req.body.categoryId, "categoryId")
    const name = parseStringField(req.body.name, "name", { maxLength: 160 })
    const quantity = parseNumberField(req.body.quantity, "quantity", { integer: true, min: 0, max: 100000 })
    const totalPrice = parseNumberField(req.body.totalPrice, "totalPrice", { min: 0 })
    const link = parseOptionalString(req.body.link, "link")
    const purchaseDate = parseIsoDate(req.body.purchaseDate, "purchaseDate")
    const usagePerUnit = parseNumberField(req.body.usagePerUnit ?? "0", "usagePerUnit", { integer: true, min: 0, max: 100000 })

    const info = db
      .prepare(`
        UPDATE Material_TB
        SET CategoryID = ?, Name = ?, Quantity = ?, TotalPrice = ?, Link = ?, PurchaseDate = ?, UsagePerUnit = ?
        WHERE ID = ?
      `)
      .run(categoryId, name, quantity, totalPrice, link, purchaseDate, usagePerUnit, id)

    if (info.changes === 0) {
      notFound("Material was not found")
    }

    res.json({ message: "Material updated successfully" })
  }),
)

materialRouter.delete(
  "/api/materials/:id",
  asyncHandler((req, res) => {
    const id = parseId(req.params.id)
    const info = db.prepare("DELETE FROM Material_TB WHERE ID = ?").run(id)
    if (info.changes === 0) {
      notFound("Material was not found")
    }

    res.json({ message: "Material deleted successfully" })
  }),
)

export { materialRouter }
