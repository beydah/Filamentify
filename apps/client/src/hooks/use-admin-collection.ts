import * as React from "react"
import { apiFetch, apiJsonBody } from "@/lib/api"
import type { Category } from "@/lib/admin-types"

interface UseAdminCollectionConfig<TEntity, TCategory extends Category> {
  entityPath: string
  categoryPath: string
}

export function useAdminCollection<TEntity, TCategory extends Category>({
  entityPath,
  categoryPath,
}: UseAdminCollectionConfig<TEntity, TCategory>) {
  const [items, setItems] = React.useState<TEntity[]>([])
  const [categories, setCategories] = React.useState<TCategory[]>([])
  const [loading, setLoading] = React.useState(true)
  const [addingCategory, setAddingCategory] = React.useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = React.useState<number | null>(null)

  const reload = React.useCallback(async () => {
    const [nextItems, nextCategories] = await Promise.all([
      apiFetch<TEntity[]>(entityPath),
      apiFetch<TCategory[]>(categoryPath),
    ])

    setItems(nextItems)
    setCategories(nextCategories)
    setLoading(false)
    return { items: nextItems, categories: nextCategories }
  }, [categoryPath, entityPath])

  React.useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const result = await Promise.all([
          apiFetch<TEntity[]>(entityPath),
          apiFetch<TCategory[]>(categoryPath),
        ])

        if (!active) {
          return
        }

        setItems(result[0])
        setCategories(result[1])
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
  }, [categoryPath, entityPath])

  const createCategory = React.useCallback(
    async (name: string) => {
      setAddingCategory(true)
      try {
        await apiFetch<TCategory>(categoryPath, {
          method: "POST",
          body: apiJsonBody({ name }),
        })
        await reload()
      } finally {
        setAddingCategory(false)
      }
    },
    [categoryPath, reload],
  )

  const deleteCategory = React.useCallback(
    async (id: number) => {
      setDeletingCategoryId(id)
      try {
        await apiFetch<{ message: string }>(`${categoryPath}/${id}`, {
          method: "DELETE",
        })
        await reload()
      } finally {
        setDeletingCategoryId(null)
      }
    },
    [categoryPath, reload],
  )

  const deleteItem = React.useCallback(
    async (id: number) => {
      await apiFetch<{ message: string }>(`${entityPath}/${id}`, {
        method: "DELETE",
      })
      await reload()
    },
    [entityPath, reload],
  )

  return {
    items,
    setItems,
    categories,
    setCategories,
    loading,
    reload,
    createCategory,
    deleteCategory,
    deleteItem,
    addingCategory,
    deletingCategoryId,
  }
}
