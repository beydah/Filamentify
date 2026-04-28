import { Router } from "express"
import db from "../db.js"
import { asyncHandler, notFound, parseId, parseStringField, sendCreated } from "../http.js"

interface CategoryRouteConfig {
  categoryTable: "Category_TB" | "ModelCategory_TB" | "MaterialCategory_TB" | "ProductCategory_TB"
  itemTable: "Filament_TB" | "Model_TB" | "Material_TB" | "Product_TB"
  route: string
  entityName: string
}

export function registerCategoryRoutes(router: Router, config: CategoryRouteConfig) {
  router.get(
    `/api/${config.route}`,
    asyncHandler((req, res) => {
      void req
      const categories = db.prepare(`SELECT * FROM ${config.categoryTable} ORDER BY Name COLLATE NOCASE ASC`).all()
      res.json(categories)
    }),
  )

  router.post(
    `/api/${config.route}`,
    asyncHandler((req, res) => {
      const name = parseStringField(req.body.name, "name", { maxLength: 120 })
      const info = db.prepare(`INSERT INTO ${config.categoryTable} (Name) VALUES (?)`).run(name)
      sendCreated(res, { ID: info.lastInsertRowid, Name: name })
    }),
  )

  router.delete(
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
