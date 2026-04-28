import assert from "node:assert/strict"
import {
  createFilamentFormState,
  createMaterialFormState,
  createModelFormState,
  createProductFormState,
  filterFilaments,
  filterMaterials,
  filterModels,
  getFilamentStockStatus,
  getProductDisplayName,
  serializeProductDraft,
  toProductFormState,
  toRelationDrafts,
} from "../src/lib/admin-logic.mjs"

function runCase(name, callback) {
  callback()
  console.log(`ok - ${name}`)
}

// ── Form state defaults ──

runCase("createFilamentFormState returns expected defaults", () => {
  const state = createFilamentFormState()
  assert.equal(state.name, "")
  assert.equal(state.categoryId, "")
  assert.equal(state.color, "#000000")
  assert.equal(state.price, "500")
  assert.equal(state.gram, "1000")
  assert.ok(state.purchaseDate instanceof Date)
})

runCase("createMaterialFormState returns expected defaults", () => {
  const state = createMaterialFormState()
  assert.equal(state.name, "")
  assert.equal(state.categoryId, "")
  assert.equal(state.quantity, "100")
  assert.equal(state.totalPrice, "100")
  assert.equal(state.usagePerUnit, "100")
})

runCase("createModelFormState returns expected defaults", () => {
  const state = createModelFormState()
  assert.equal(state.name, "")
  assert.equal(state.file, null)
  assert.equal(state.gram, "5.00")
  assert.equal(state.pieceCount, "1")
})

runCase("createProductFormState returns expected defaults", () => {
  const state = createProductFormState()
  assert.equal(state.name, "")
  assert.equal(state.imageFront, null)
  assert.equal(state.imageBack, null)
  assert.deepEqual(state.selectedMaterials, [])
  assert.deepEqual(state.selectedModels, [])
  assert.deepEqual(state.selectedFilaments, [])
  assert.equal(state.profitMultiplier, "1.5")
})

// ── Filament stock status ──

runCase("getFilamentStockStatus returns empty when Available_Gram is 0", () => {
  assert.equal(getFilamentStockStatus({ Available_Gram: 0, Gram: 1000 }), "empty")
})

runCase("getFilamentStockStatus returns low when below 25%", () => {
  assert.equal(getFilamentStockStatus({ Available_Gram: 200, Gram: 1000 }), "low")
})

runCase("getFilamentStockStatus returns healthy when above 25%", () => {
  assert.equal(getFilamentStockStatus({ Available_Gram: 800, Gram: 1000 }), "healthy")
})

runCase("getFilamentStockStatus returns low at exactly 25%", () => {
  assert.equal(getFilamentStockStatus({ Available_Gram: 250, Gram: 1000 }), "low")
})

// ── Filter functions ──

runCase("filterFilaments filters by category, color, and stock", () => {
  const filaments = [
    { CategoryID: 1, Color: "#ff0000", Available_Gram: 800, Gram: 1000 },
    { CategoryID: 2, Color: "#00ff00", Available_Gram: 0, Gram: 1000 },
    { CategoryID: 1, Color: "#0000ff", Available_Gram: 100, Gram: 1000 },
  ]

  assert.equal(filterFilaments(filaments, { categoryId: "all", color: "all", stock: "all" }).length, 3)
  assert.equal(filterFilaments(filaments, { categoryId: "1", color: "all", stock: "all" }).length, 2)
  assert.equal(filterFilaments(filaments, { categoryId: "all", color: "#ff0000", stock: "all" }).length, 1)
  assert.equal(filterFilaments(filaments, { categoryId: "all", color: "all", stock: "empty" }).length, 1)
  assert.equal(filterFilaments(filaments, { categoryId: "all", color: "all", stock: "healthy" }).length, 1)
  assert.equal(filterFilaments(filaments, { categoryId: "all", color: "all", stock: "low" }).length, 1)
})

runCase("filterMaterials filters by category and stock level", () => {
  const materials = [
    { CategoryID: 1, Quantity: 100 },
    { CategoryID: 2, Quantity: 5 },
    { CategoryID: 1, Quantity: 0 },
  ]

  assert.equal(filterMaterials(materials, { categoryId: "all", stock: "all" }).length, 3)
  assert.equal(filterMaterials(materials, { categoryId: "1", stock: "all" }).length, 2)
  assert.equal(filterMaterials(materials, { categoryId: "all", stock: "stock" }).length, 1)
  assert.equal(filterMaterials(materials, { categoryId: "all", stock: "low" }).length, 2)
})

runCase("filterModels filters by category", () => {
  const models = [
    { CategoryID: 1 },
    { CategoryID: 2 },
    { CategoryID: 1 },
  ]

  assert.equal(filterModels(models, { categoryId: "all" }).length, 3)
  assert.equal(filterModels(models, { categoryId: "1" }).length, 2)
  assert.equal(filterModels(models, { categoryId: "3" }).length, 0)
})

// ── Relation drafts ──

runCase("toRelationDrafts maps relation objects", () => {
  const relations = [
    { ID: 10, Quantity: 5 },
    { ID: 20, Quantity: 3 },
  ]
  const result = toRelationDrafts(relations)
  assert.deepEqual(result, [
    { id: 10, quantity: 5 },
    { id: 20, quantity: 3 },
  ])
})

runCase("toRelationDrafts handles empty/undefined input", () => {
  assert.deepEqual(toRelationDrafts(), [])
  assert.deepEqual(toRelationDrafts([]), [])
})

// ── Serialize product draft ──

runCase("serializeProductDraft serializes relations as JSON strings", () => {
  const draft = {
    ...createProductFormState(),
    name: "Test",
    selectedMaterials: [{ id: 1, quantity: 2 }],
    selectedModels: [{ id: 3, quantity: 4 }],
    selectedFilaments: [],
  }

  const serialized = serializeProductDraft(draft)
  assert.equal(serialized.name, "Test")
  assert.equal(serialized.materials, JSON.stringify([{ id: 1, quantity: 2 }]))
  assert.equal(serialized.models, JSON.stringify([{ id: 3, quantity: 4 }]))
  assert.equal(serialized.filaments, "[]")
})

// ── toProductFormState ──

runCase("toProductFormState converts a product entity to form state", () => {
  const product = {
    Name: "Widget",
    Description: "A widget",
    Price: 25,
    Stock: 10,
    ProfitMultiplier: 2.0,
    ParentID: 5,
    CategoryID: 3,
    materials: [{ ID: 1, Quantity: 2 }],
    models: [{ ID: 4, Quantity: 1 }],
    filaments: [],
  }

  const state = toProductFormState(product)
  assert.equal(state.name, "Widget")
  assert.equal(state.description, "A widget")
  assert.equal(state.price, "25")
  assert.equal(state.stock, "10")
  assert.equal(state.profitMultiplier, "2")
  assert.equal(state.parentId, "5")
  assert.equal(state.categoryId, "3")
  assert.deepEqual(state.selectedMaterials, [{ id: 1, quantity: 2 }])
  assert.deepEqual(state.selectedModels, [{ id: 4, quantity: 1 }])
  assert.deepEqual(state.selectedFilaments, [])
})

runCase("toProductFormState handles null product", () => {
  const state = toProductFormState(null)
  assert.equal(state.name, "")
})

// ── getProductDisplayName ──

runCase("getProductDisplayName returns name for top-level product", () => {
  const product = { Name: "Main Product", ParentID: null }
  assert.equal(getProductDisplayName(product, []), "Main Product")
})

runCase("getProductDisplayName returns parent/child path for sub-product", () => {
  const parent = { ID: 1, Name: "Parent" }
  const child = { Name: "Child", ParentID: 1 }
  assert.equal(getProductDisplayName(child, [parent]), "Parent / Child")
})

runCase("getProductDisplayName handles missing parent gracefully", () => {
  const child = { Name: "Orphan", ParentID: 99, ParentName: "FallbackParent" }
  assert.equal(getProductDisplayName(child, []), "FallbackParent / Orphan")
})

runCase("getProductDisplayName handles null product", () => {
  assert.equal(getProductDisplayName(null), "")
})

console.log("\nAll admin-logic tests passed!")
