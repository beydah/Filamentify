export function createFilamentFormState() {
  return {
    categoryId: "",
    name: "",
    color: "#000000",
    price: "500",
    gram: "1000",
    purchaseDate: new Date(),
    link: "",
  }
}

export function createMaterialFormState() {
  return {
    categoryId: "",
    name: "",
    quantity: "100",
    totalPrice: "100",
    purchaseDate: new Date(),
    link: "",
    usagePerUnit: "100",
  }
}

export function createModelFormState() {
  return {
    categoryId: "",
    name: "",
    link: "",
    gram: "5.00",
    pieceCount: "1",
    file: null,
  }
}

export function createProductFormState() {
  return {
    name: "",
    description: "",
    price: "0",
    stock: "0",
    profitMultiplier: "1.5",
    parentId: "",
    categoryId: "",
    imageFront: null,
    imageBack: null,
    selectedMaterials: [],
    selectedModels: [],
    selectedFilaments: [],
  }
}

export function getFilamentStockStatus(filament) {
  const available = Number(filament.Available_Gram || 0)
  const total = Number(filament.Gram || 0)

  if (available <= 0) {
    return "empty"
  }

  if (total > 0 && available / total <= 0.25) {
    return "low"
  }

  return "healthy"
}

export function filterFilaments(filaments, filters) {
  return filaments.filter((filament) => {
    const matchesCategory = filters.categoryId === "all" || String(filament.CategoryID || "") === filters.categoryId
    const matchesColor = filters.color === "all" || filament.Color === filters.color
    const status = getFilamentStockStatus(filament)
    const matchesStock =
      filters.stock === "all" ||
      (filters.stock === "healthy" && status === "healthy") ||
      (filters.stock === "low" && status === "low") ||
      (filters.stock === "empty" && status === "empty")

    return matchesCategory && matchesColor && matchesStock
  })
}

export function filterMaterials(materials, filters) {
  return materials.filter((material) => {
    const matchesCategory = filters.categoryId === "all" || String(material.CategoryID || "") === filters.categoryId
    const quantity = Number(material.Quantity || 0)
    const matchesStock =
      filters.stock === "all" ||
      (filters.stock === "stock" && quantity >= 10) ||
      (filters.stock === "low" && quantity < 10)

    return matchesCategory && matchesStock
  })
}

export function filterModels(models, filters) {
  return models.filter((model) => filters.categoryId === "all" || String(model.CategoryID || "") === filters.categoryId)
}

export function toRelationDrafts(relations = []) {
  return relations.map((relation) => ({
    id: Number(relation.ID),
    quantity: Number(relation.Quantity),
  }))
}

export function serializeProductDraft(draft) {
  return {
    name: draft.name,
    description: draft.description,
    price: draft.price,
    stock: draft.stock,
    profitMultiplier: draft.profitMultiplier,
    parentId: draft.parentId,
    categoryId: draft.categoryId,
    materials: JSON.stringify(draft.selectedMaterials),
    models: JSON.stringify(draft.selectedModels),
    filaments: JSON.stringify(draft.selectedFilaments),
  }
}

export function toProductFormState(product) {
  const next = createProductFormState()
  if (!product) {
    return next
  }

  return {
    ...next,
    name: product.Name || "",
    description: product.Description || "",
    price: String(product.Price ?? 0),
    stock: String(product.Stock ?? 0),
    profitMultiplier: String(product.ProfitMultiplier ?? 1.5),
    parentId: product.ParentID ? String(product.ParentID) : "",
    categoryId: product.CategoryID ? String(product.CategoryID) : "",
    selectedMaterials: toRelationDrafts(product.materials),
    selectedModels: toRelationDrafts(product.models),
    selectedFilaments: toRelationDrafts(product.filaments),
  }
}

export function getProductDisplayName(product, products = []) {
  if (!product) {
    return ""
  }

  if (!product.ParentID) {
    return product.Name
  }

  const parent = products.find((candidate) => candidate.ID === product.ParentID)
  return `${parent?.Name || product.ParentName || "Parent"} / ${product.Name}`
}
