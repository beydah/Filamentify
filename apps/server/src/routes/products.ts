import { Router } from "express"
import db from "../db.js"
import {
  asyncHandler,
  assert,
  notFound,
  parseId,
  parseNumberField,
  parseOptionalId,
  parseOptionalString,
  parseStringField,
  sendCreated,
} from "../http.js"
import { getUploadedFile, persistUpload, removeUpload, uploadProductImages } from "../security.js"

const productsRouter = Router()

interface ProductRelationInput {
  id: number
  quantity: number
}

function parseRelationInput(raw: unknown, field: string, isPercent = false): ProductRelationInput[] {
  if (raw === undefined || raw === null || raw === "") {
    return []
  }

  let parsed = raw
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw)
    } catch {
      assert(false, 400, `${field} must be valid JSON`, "validation_error")
    }
  }

  assert(Array.isArray(parsed), 400, `${field} must be an array`, "validation_error")

  return parsed.map((entry, index) => {
    assert(typeof entry === "object" && entry !== null, 400, `${field}[${index}] must be an object`, "validation_error")

    const id = parseId((entry as { id: unknown }).id, `${field}[${index}].id`)
    const quantity = parseNumberField((entry as { quantity: unknown }).quantity, `${field}[${index}].quantity`, {
      integer: true,
      min: 0,
      max: isPercent ? 100 : 100000,
    })

    return { id, quantity }
  })
}

function upsertProductRelations(
  productId: number,
  tableName: "ProductMaterials_TB" | "ProductModels_TB" | "ProductFilaments_TB",
  foreignKeyName: "MaterialID" | "ModelID" | "FilamentID",
  entries: ProductRelationInput[],
) {
  db.prepare(`DELETE FROM ${tableName} WHERE ProductID = ?`).run(productId)
  if (entries.length === 0) {
    return
  }

  const insert = db.prepare(`INSERT INTO ${tableName} (ProductID, ${foreignKeyName}, Quantity) VALUES (?, ?, ?)`)
  for (const entry of entries) {
    insert.run(productId, entry.id, entry.quantity)
  }
}

function listProducts() {
  const products = db
    .prepare(`
      SELECT
        p.*,
        c.Name AS CategoryName,
        parent.Name AS ParentName
      FROM Product_TB p
      LEFT JOIN ProductCategory_TB c ON c.ID = p.CategoryID
      LEFT JOIN Product_TB parent ON parent.ID = p.ParentID
      ORDER BY p.ID DESC
    `)
    .all() as Array<Record<string, unknown> & { ID: number }>

  return products.map((product) => {
    const materials = db
      .prepare(`
        SELECT pm.ProductID, pm.MaterialID, pm.Quantity, m.ID, m.Name
        FROM ProductMaterials_TB pm
        JOIN Material_TB m ON m.ID = pm.MaterialID
        WHERE pm.ProductID = ?
      `)
      .all(product.ID)

    const models = db
      .prepare(`
        SELECT pm.ProductID, pm.ModelID, pm.Quantity, m.ID, m.Name
        FROM ProductModels_TB pm
        JOIN Model_TB m ON m.ID = pm.ModelID
        WHERE pm.ProductID = ?
      `)
      .all(product.ID)

    const filaments = db
      .prepare(`
        SELECT pf.ProductID, pf.FilamentID, pf.Quantity, f.ID, f.Name
        FROM ProductFilaments_TB pf
        JOIN Filament_TB f ON f.ID = pf.FilamentID
        WHERE pf.ProductID = ?
      `)
      .all(product.ID)

    return { ...product, materials, models, filaments }
  })
}

const createProductTransaction = db.transaction((payload: {
  name: string
  description: string | null
  price: number
  stock: number
  imageFront: string | null
  imageBack: string | null
  profitMultiplier: number
  parentId: number | null
  categoryId: number | null
  materials: ProductRelationInput[]
  models: ProductRelationInput[]
  filaments: ProductRelationInput[]
}) => {
  const info = db
    .prepare(`
      INSERT INTO Product_TB (Name, Description, Price, Stock, ImageFront, ImageBack, ProfitMultiplier, ParentID, CategoryID)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      payload.name,
      payload.description,
      payload.price,
      payload.stock,
      payload.imageFront,
      payload.imageBack,
      payload.profitMultiplier,
      payload.parentId,
      payload.categoryId,
    )

  const productId = Number(info.lastInsertRowid)
  upsertProductRelations(productId, "ProductMaterials_TB", "MaterialID", payload.materials)
  upsertProductRelations(productId, "ProductModels_TB", "ModelID", payload.models)
  upsertProductRelations(productId, "ProductFilaments_TB", "FilamentID", payload.filaments)

  return productId
})

const updateProductTransaction = db.transaction((payload: {
  id: number
  name: string
  description: string | null
  price: number
  stock: number
  imageFront: string | null
  imageBack: string | null
  profitMultiplier: number
  parentId: number | null
  categoryId: number | null
  materials: ProductRelationInput[]
  models: ProductRelationInput[]
  filaments: ProductRelationInput[]
}) => {
  const info = db
    .prepare(`
      UPDATE Product_TB
      SET Name = ?, Description = ?, Price = ?, Stock = ?, ImageFront = ?, ImageBack = ?, ProfitMultiplier = ?, ParentID = ?, CategoryID = ?
      WHERE ID = ?
    `)
    .run(
      payload.name,
      payload.description,
      payload.price,
      payload.stock,
      payload.imageFront,
      payload.imageBack,
      payload.profitMultiplier,
      payload.parentId,
      payload.categoryId,
      payload.id,
    )

  if (info.changes === 0) {
    notFound("Product was not found")
  }

  upsertProductRelations(payload.id, "ProductMaterials_TB", "MaterialID", payload.materials)
  upsertProductRelations(payload.id, "ProductModels_TB", "ModelID", payload.models)
  upsertProductRelations(payload.id, "ProductFilaments_TB", "FilamentID", payload.filaments)
})

productsRouter.get(
  "/api/products",
  asyncHandler((req, res) => {
    void req
    res.json(listProducts())
  }),
)

productsRouter.post(
  "/api/products",
  uploadProductImages,
  asyncHandler(async (req, res) => {
    const name = parseStringField(req.body.name, "name", { maxLength: 160 })
    const description = parseOptionalString(req.body.description, "description", 1000)
    const price = parseNumberField(req.body.price, "price", { min: 0 })
    const stock = parseNumberField(req.body.stock, "stock", { integer: true, min: 0 })
    const profitMultiplier = parseNumberField(req.body.profitMultiplier ?? "1", "profitMultiplier", { min: 0 })
    const parentId = parseOptionalId(req.body.parentId, "parentId")
    const categoryId = parseOptionalId(req.body.categoryId, "categoryId")
    const materials = parseRelationInput(req.body.materials, "materials")
    const models = parseRelationInput(req.body.models, "models")
    const filaments = parseRelationInput(req.body.filaments, "filaments", true)
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined
    const imageFront = await persistUpload(getUploadedFile(files, "imageFront"), "image")
    const imageBack = await persistUpload(getUploadedFile(files, "imageBack"), "image")

    try {
      const productId = createProductTransaction({
        name,
        description,
        price,
        stock,
        imageFront,
        imageBack,
        profitMultiplier,
        parentId,
        categoryId,
        materials,
        models,
        filaments,
      })

      sendCreated(res, { ID: productId })
    } catch (error) {
      await Promise.all([removeUpload(imageFront), removeUpload(imageBack)])
      throw error
    }
  }),
)

productsRouter.patch(
  "/api/products/:id",
  uploadProductImages,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id)
    const current = db.prepare("SELECT ImageFront, ImageBack FROM Product_TB WHERE ID = ?").get(id) as
      | {
          ImageFront: string | null
          ImageBack: string | null
        }
      | undefined

    if (!current) {
      notFound("Product was not found")
    }

    const name = parseStringField(req.body.name, "name", { maxLength: 160 })
    const description = parseOptionalString(req.body.description, "description", 1000)
    const price = parseNumberField(req.body.price, "price", { min: 0 })
    const stock = parseNumberField(req.body.stock, "stock", { integer: true, min: 0 })
    const profitMultiplier = parseNumberField(req.body.profitMultiplier ?? "1", "profitMultiplier", { min: 0 })
    const parentId = parseOptionalId(req.body.parentId, "parentId")
    const categoryId = parseOptionalId(req.body.categoryId, "categoryId")
    const materials = parseRelationInput(req.body.materials, "materials")
    const models = parseRelationInput(req.body.models, "models")
    const filaments = parseRelationInput(req.body.filaments, "filaments", true)
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined
    const nextFront = await persistUpload(getUploadedFile(files, "imageFront"), "image")
    const nextBack = await persistUpload(getUploadedFile(files, "imageBack"), "image")

    try {
      updateProductTransaction({
        id,
        name,
        description,
        price,
        stock,
        imageFront: nextFront ?? current.ImageFront,
        imageBack: nextBack ?? current.ImageBack,
        profitMultiplier,
        parentId,
        categoryId,
        materials,
        models,
        filaments,
      })

      if (nextFront && current.ImageFront) {
        await removeUpload(current.ImageFront)
      }

      if (nextBack && current.ImageBack) {
        await removeUpload(current.ImageBack)
      }

      res.json({ message: "Product updated successfully" })
    } catch (error) {
      await Promise.all([removeUpload(nextFront), removeUpload(nextBack)])
      throw error
    }
  }),
)

productsRouter.delete(
  "/api/products/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id)
    const current = db.prepare("SELECT ImageFront, ImageBack FROM Product_TB WHERE ID = ?").get(id) as
      | {
          ImageFront: string | null
          ImageBack: string | null
        }
      | undefined

    if (!current) {
      notFound("Product was not found")
    }

    const info = db.prepare("DELETE FROM Product_TB WHERE ID = ?").run(id)
    if (info.changes === 0) {
      notFound("Product was not found")
    }

    await Promise.all([removeUpload(current.ImageFront), removeUpload(current.ImageBack)])
    res.json({ message: "Product deleted successfully" })
  }),
)

export { productsRouter }
