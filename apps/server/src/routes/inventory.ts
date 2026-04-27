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
import { getUploadedFile, persistUpload, removeUpload, uploadSingle } from "../security.js"

const inventoryRouter = Router()

interface RelationConfig {
  categoryTable: "Category_TB" | "ModelCategory_TB" | "MaterialCategory_TB" | "ProductCategory_TB"
  itemTable: "Filament_TB" | "Model_TB" | "Material_TB" | "Product_TB"
  route: string
  entityName: string
}

function registerCategoryRoutes(config: RelationConfig) {
  inventoryRouter.get(
    `/api/${config.route}`,
    asyncHandler((req, res) => {
      void req
      const categories = db.prepare(`SELECT * FROM ${config.categoryTable} ORDER BY Name COLLATE NOCASE ASC`).all()
      res.json(categories)
    }),
  )

  inventoryRouter.post(
    `/api/${config.route}`,
    asyncHandler((req, res) => {
      const name = parseStringField(req.body.name, "name", { maxLength: 120 })
      const info = db.prepare(`INSERT INTO ${config.categoryTable} (Name) VALUES (?)`).run(name)
      sendCreated(res, { ID: info.lastInsertRowid, Name: name })
    }),
  )

  inventoryRouter.delete(
    `/api/${config.route}/:id`,
    asyncHandler((req, res) => {
      const id = parseId(req.params.id)
      const current = db.prepare(`SELECT ID FROM ${config.categoryTable} WHERE ID = ?`).get(id) as { ID: number } | undefined
      if (!current) {
        notFound(`${config.entityName} category was not found`)
      }

      const usage = db.prepare(`SELECT COUNT(*) AS count FROM ${config.itemTable} WHERE CategoryID = ?`).get(id) as { count: number }
      if (usage.count > 0) {
        res.status(409).json({
          error: "Category is in use and cannot be deleted",
          code: "category_in_use",
        })
        return
      }

      db.prepare(`DELETE FROM ${config.categoryTable} WHERE ID = ?`).run(id)
      res.json({ message: `${config.entityName} category deleted successfully` })
    }),
  )
}

registerCategoryRoutes({
  categoryTable: "Category_TB",
  itemTable: "Filament_TB",
  route: "categories",
  entityName: "Filament",
})

registerCategoryRoutes({
  categoryTable: "ModelCategory_TB",
  itemTable: "Model_TB",
  route: "model-categories",
  entityName: "Model",
})

registerCategoryRoutes({
  categoryTable: "MaterialCategory_TB",
  itemTable: "Material_TB",
  route: "material-categories",
  entityName: "Material",
})

registerCategoryRoutes({
  categoryTable: "ProductCategory_TB",
  itemTable: "Product_TB",
  route: "product-categories",
  entityName: "Product",
})

inventoryRouter.get(
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

inventoryRouter.post(
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

inventoryRouter.patch(
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

inventoryRouter.delete(
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

inventoryRouter.get(
  "/api/models",
  asyncHandler((req, res) => {
    void req
    const models = db
      .prepare(`
        SELECT m.*, c.Name AS CategoryName
        FROM Model_TB m
        LEFT JOIN ModelCategory_TB c ON c.ID = m.CategoryID
        ORDER BY m.ID DESC
      `)
      .all()

    res.json(models)
  }),
)

inventoryRouter.post(
  "/api/models",
  uploadSingle,
  asyncHandler(async (req, res) => {
    const categoryId = parseId(req.body.categoryId, "categoryId")
    const name = parseStringField(req.body.name, "name", { maxLength: 160 })
    const link = parseOptionalString(req.body.link, "link")
    const gram = parseNumberField(req.body.gram, "gram", { min: 0 })
    const pieceCount = parseNumberField(req.body.pieceCount ?? "1", "pieceCount", { integer: true, min: 1, max: 1000 })
    const fileName = await persistUpload(getUploadedFile(req.file ? [req.file] : undefined, "file"), "model")

    const info = db
      .prepare(`
        INSERT INTO Model_TB (CategoryID, Name, Link, Gram, PieceCount, FilePath)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(categoryId, name, link, gram, pieceCount, fileName)

    sendCreated(res, {
      ID: info.lastInsertRowid,
      CategoryID: categoryId,
      Name: name,
      Link: link,
      Gram: gram,
      PieceCount: pieceCount,
      FilePath: fileName,
    })
  }),
)

inventoryRouter.patch(
  "/api/models/:id",
  uploadSingle,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id)
    const current = db.prepare("SELECT FilePath FROM Model_TB WHERE ID = ?").get(id) as { FilePath: string | null } | undefined
    if (!current) {
      notFound("Model was not found")
    }

    const categoryId = parseId(req.body.categoryId, "categoryId")
    const name = parseStringField(req.body.name, "name", { maxLength: 160 })
    const link = parseOptionalString(req.body.link, "link")
    const gram = parseNumberField(req.body.gram, "gram", { min: 0 })
    const pieceCount = parseNumberField(req.body.pieceCount ?? "1", "pieceCount", { integer: true, min: 1, max: 1000 })
    const newFileName = await persistUpload(getUploadedFile(req.file ? [req.file] : undefined, "file"), "model")

    try {
      const info = db
        .prepare(`
          UPDATE Model_TB
          SET CategoryID = ?, Name = ?, Link = ?, Gram = ?, PieceCount = ?, FilePath = ?
          WHERE ID = ?
        `)
        .run(categoryId, name, link, gram, pieceCount, newFileName ?? current.FilePath, id)

      if (info.changes === 0) {
        notFound("Model was not found")
      }

      if (newFileName && current.FilePath) {
        await removeUpload(current.FilePath)
      }

      res.json({ message: "Model updated successfully" })
    } catch (error) {
      await removeUpload(newFileName)
      throw error
    }
  }),
)

inventoryRouter.delete(
  "/api/models/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id)
    const current = db.prepare("SELECT FilePath FROM Model_TB WHERE ID = ?").get(id) as { FilePath: string | null } | undefined
    if (!current) {
      notFound("Model was not found")
    }

    const info = db.prepare("DELETE FROM Model_TB WHERE ID = ?").run(id)
    if (info.changes === 0) {
      notFound("Model was not found")
    }

    await removeUpload(current.FilePath)
    res.json({ message: "Model deleted successfully" })
  }),
)

inventoryRouter.get(
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

inventoryRouter.post(
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

inventoryRouter.patch(
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

inventoryRouter.delete(
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

export { inventoryRouter }
