import { Router } from "express"
import db from "../db.js"
import {
  asyncHandler,
  notFound,
  parseId,
  parseNumberField,
  parseOptionalId,
  parseOptionalString,
  parseStringField,
  sendCreated,
} from "../http.js"
import { getUploadedFile, persistUpload, removeUpload, uploadProductImages } from "../security.js"
import { registerCategoryRoutes } from "./category-factory.js"
import {
  createProductTransaction,
  listProducts,
  parseRelationInput,
  updateProductTransaction,
} from "../services/product-service.js"

const productsRouter = Router()

registerCategoryRoutes(productsRouter, {
  categoryTable: "ProductCategory_TB",
  itemTable: "Product_TB",
  route: "product-categories",
  entityName: "Product",
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
