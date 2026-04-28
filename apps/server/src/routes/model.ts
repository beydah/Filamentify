import { Router } from "express"
import db from "../db.js"
import {
  asyncHandler,
  notFound,
  parseId,
  parseNumberField,
  parseOptionalString,
  parseStringField,
  sendCreated,
} from "../http.js"
import { getUploadedFile, persistUpload, removeUpload, uploadSingle } from "../security.js"
import { registerCategoryRoutes } from "./category-factory.js"

const modelRouter = Router()

registerCategoryRoutes(modelRouter, {
  categoryTable: "ModelCategory_TB",
  itemTable: "Model_TB",
  route: "model-categories",
  entityName: "Model",
})

modelRouter.get(
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

modelRouter.post(
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

modelRouter.patch(
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

modelRouter.delete(
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

export { modelRouter }
