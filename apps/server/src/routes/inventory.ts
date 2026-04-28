import { Router } from "express"
import { filamentRouter } from "./filament.js"
import { modelRouter } from "./model.js"
import { materialRouter } from "./material.js"

const inventoryRouter = Router()

inventoryRouter.use(filamentRouter)
inventoryRouter.use(modelRouter)
inventoryRouter.use(materialRouter)

export { inventoryRouter }
