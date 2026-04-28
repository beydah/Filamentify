import db from "../db.js"
import { assert, notFound, parseId, parseNumberField } from "../http.js"

export interface ProductRelationInput {
  id: number
  quantity: number
}

export function parseRelationInput(raw: unknown, field: string, isPercent = false): ProductRelationInput[] {
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

export function upsertProductRelations(
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

export function listProducts() {
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

interface ProductPayload {
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
}

export const createProductTransaction = db.transaction((payload: ProductPayload) => {
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

export const updateProductTransaction = db.transaction((payload: ProductPayload & { id: number }) => {
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
