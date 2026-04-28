import * as React from "react"
import { apiFetch, apiJsonBody } from "@/lib/api"
import type { Filament, Material, Model, Product, ProductCategory } from "@/lib/admin-types"

export function useProductCatalog() {
  const [products, setProducts] = React.useState<Product[]>([])
  const [materials, setMaterials] = React.useState<Material[]>([])
  const [models, setModels] = React.useState<Model[]>([])
  const [filaments, setFilaments] = React.useState<Filament[]>([])
  const [categories, setCategories] = React.useState<ProductCategory[]>([])
  const [loading, setLoading] = React.useState(true)
  const [addingCategory, setAddingCategory] = React.useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = React.useState<number | null>(null)

  const reload = React.useCallback(async () => {
    const [nextProducts, nextMaterials, nextModels, nextFilaments, nextCategories] = await Promise.all([
      apiFetch<Product[]>("/api/products"),
      apiFetch<Material[]>("/api/materials"),
      apiFetch<Model[]>("/api/models"),
      apiFetch<Filament[]>("/api/filaments"),
      apiFetch<ProductCategory[]>("/api/product-categories"),
    ])

    setProducts(nextProducts)
    setMaterials(nextMaterials)
    setModels(nextModels)
    setFilaments(nextFilaments)
    setCategories(nextCategories)
    setLoading(false)
  }, [])

  React.useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const [nextProducts, nextMaterials, nextModels, nextFilaments, nextCategories] = await Promise.all([
          apiFetch<Product[]>("/api/products"),
          apiFetch<Material[]>("/api/materials"),
          apiFetch<Model[]>("/api/models"),
          apiFetch<Filament[]>("/api/filaments"),
          apiFetch<ProductCategory[]>("/api/product-categories"),
        ])

        if (!active) {
          return
        }

        setProducts(nextProducts)
        setMaterials(nextMaterials)
        setModels(nextModels)
        setFilaments(nextFilaments)
        setCategories(nextCategories)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const createCategory = React.useCallback(async (name: string) => {
    setAddingCategory(true)
    try {
      await apiFetch<ProductCategory>("/api/product-categories", {
        method: "POST",
        body: apiJsonBody({ name }),
      })
      await reload()
    } finally {
      setAddingCategory(false)
    }
  }, [reload])

  const deleteCategory = React.useCallback(async (id: number) => {
    setDeletingCategoryId(id)
    try {
      await apiFetch<{ message: string }>(`/api/product-categories/${id}`, {
        method: "DELETE",
      })
      await reload()
    } finally {
      setDeletingCategoryId(null)
    }
  }, [reload])

  const deleteProduct = React.useCallback(async (id: number) => {
    await apiFetch<{ message: string }>(`/api/products/${id}`, {
      method: "DELETE",
    })
    await reload()
  }, [reload])

  return {
    products,
    materials,
    models,
    filaments,
    categories,
    loading,
    reload,
    createCategory,
    deleteCategory,
    deleteProduct,
    addingCategory,
    deletingCategoryId,
  }
}
