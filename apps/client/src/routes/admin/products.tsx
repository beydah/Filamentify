import * as React from "react"
import { useTranslation } from "react-i18next"
import { Box, Edit3, Eye, Loader2, MoreVertical, Package, Plus, ShoppingBag, Trash2 } from "lucide-react"

import type { Product, ProductCategory, ProductFormState } from "@/lib/admin-types"
import { apiFetch } from "@/lib/api"
import { createProductFormState, getProductDisplayName, serializeProductDraft, toProductFormState } from "@/lib/admin-logic.mjs"
import { useProductCatalog } from "@/hooks/use-product-catalog"
import { AdminDialogShell } from "@/ui/admin/admin-dialog-shell"
import { AdminPageShell } from "@/ui/admin/admin-page-shell"
import { AdminSectionCard } from "@/ui/admin/admin-section-card"
import { AdminTableCard } from "@/ui/admin/admin-table-card"
import { CategoryCard } from "@/ui/admin/CategoryCard"
import { EntitySelect } from "@/ui/admin/entity-select"
import { ModelViewer } from "@/ui/admin/model-viewer"
import { ProductEditorForm } from "@/ui/admin/product-editor-form"
import { Button } from "@/ui/controls/button"
import { Dialog } from "@/ui/controls/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/controls/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/controls/table"
import { toast } from "sonner"

function buildProductBody(draft: ProductFormState) {
  const body = new FormData()
  const serialized = serializeProductDraft(draft)

  for (const [key, value] of Object.entries(serialized)) {
    body.append(key, value)
  }

  if (draft.imageFront) {
    body.append("imageFront", draft.imageFront)
  }

  if (draft.imageBack) {
    body.append("imageBack", draft.imageBack)
  }

  return body
}

export default function ProductsPage() {
  const { t } = useTranslation()
  const catalog = useProductCatalog()

  const [formState, setFormState] = React.useState<{ data: ProductFormState; submitting: boolean }>({
    data: createProductFormState(),
    submitting: false,
  })
  const [editState, setEditState] = React.useState<{ open: boolean; source: Product | null; data: ProductFormState; submitting: boolean }>({
    open: false,
    source: null,
    data: createProductFormState(),
    submitting: false,
  })
  const [detailState, setDetailState] = React.useState({
    open: false,
    item: null as Product | null,
  })
  const [filters, setFilters] = React.useState({
    categoryId: "all",
    type: "all",
  })
  const [filterSelectOpen, setFilterSelectOpen] = React.useState(false)

  const products = catalog.products
  const categories = catalog.categories
  const categoryOptions = React.useMemo(
    () => categories.map((category: ProductCategory) => ({ value: String(category.ID), label: category.Name })),
    [categories],
  )
  const filteredProducts = React.useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory = filters.categoryId === "all" || String(product.CategoryID || "") === filters.categoryId
        const matchesType =
          filters.type === "all" ||
          (filters.type === "parent" && !product.ParentID) ||
          (filters.type === "sub" && Boolean(product.ParentID))

        return matchesCategory && matchesType
      }),
    [filters, products],
  )

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formState.data.name) {
      return
    }

    setFormState((current) => ({ ...current, submitting: true }))
    try {
      await apiFetch("/api/products", {
        method: "POST",
        body: buildProductBody(formState.data),
      })
      toast.success(t("common.notifications.added"))
      setFormState({ data: createProductFormState(), submitting: false })
      await catalog.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.notifications.delete_error"))
      setFormState((current) => ({ ...current, submitting: false }))
    }
  }

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editState.source) {
      return
    }

    setEditState((current) => ({ ...current, submitting: true }))
    try {
      await apiFetch(`/api/products/${editState.source.ID}`, {
        method: "PATCH",
        body: buildProductBody(editState.data),
      })
      toast.success(t("common.notifications.updated"))
      setEditState({
        open: false,
        source: null,
        data: createProductFormState(),
        submitting: false,
      })
      await catalog.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.notifications.delete_error"))
      setEditState((current) => ({ ...current, submitting: false }))
    }
  }

  const handleDeleteCategory = async (id: number) => {
    try {
      await catalog.deleteCategory(id)
      toast.success(t("common.notifications.cat_deleted"))
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common.notifications.cat_delete_error")
      toast.error(message.includes("in use") ? t("common.notifications.cat_in_use") : message)
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    if (products.some((candidate) => candidate.ParentID === product.ID)) {
      toast.error(t("products.delete_parent_error"))
      return
    }

    try {
      await catalog.deleteProduct(product.ID)
      toast.success(t("common.notifications.deleted"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.notifications.delete_error"))
    }
  }

  return (
    <AdminPageShell title={t("nav.products")}>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <AdminSectionCard title={t("products.new_record")} description={t("products.new_record_desc")} icon={Plus}>
            <ProductEditorForm
              draft={formState.data}
              onChange={(data) => setFormState((current) => ({ ...current, data }))}
              onSubmit={handleCreate}
              submitting={formState.submitting}
              products={products}
              categories={catalog.categories}
              materials={catalog.materials}
              models={catalog.models}
              filaments={catalog.filaments}
              submitLabel={t("common.save")}
            />
          </AdminSectionCard>

          <CategoryCard
            id="category-management"
            title={t("common.add_category")}
            description={t("products.categories_desc")}
            categories={catalog.categories}
            onAdd={async (name) => {
              try {
                await catalog.createCategory(name)
                toast.success(t("common.notifications.added"))
              } catch (error) {
                toast.error(error instanceof Error ? error.message : t("common.notifications.cat_delete_error"))
              }
            }}
            onDelete={handleDeleteCategory}
            addingCategory={catalog.addingCategory}
            deletingCategoryId={catalog.deletingCategoryId}
          />
        </div>

        <div className="lg:col-span-7">
          <AdminTableCard
            title={t("products.inventory")}
            description={t("products.inventory_desc")}
            icon={ShoppingBag}
            countLabel={t("filament.total")}
            count={products.length}
          >
            <div className="flex flex-wrap gap-3 border-b border-muted/20 p-4">
              <div className="min-w-[180px] flex-1">
                <EntitySelect
                  open={filterSelectOpen}
                  onOpenChange={setFilterSelectOpen}
                  value={filters.categoryId}
                  onChange={(value) => setFilters((current) => ({ ...current, categoryId: value }))}
                  placeholder={t("common.category")}
                  searchPlaceholder={t("common.search_category")}
                  emptyLabel={t("common.category_not_found")}
                  options={[{ value: "all", label: t("common.all") }, ...categoryOptions]}
                />
              </div>
              <div className="flex min-w-[220px] flex-1 gap-2">
                <Button type="button" variant={filters.type === "all" ? "default" : "outline"} className="flex-1" onClick={() => setFilters((current) => ({ ...current, type: "all" }))}>
                  {t("common.all")}
                </Button>
                <Button type="button" variant={filters.type === "parent" ? "default" : "outline"} className="flex-1" onClick={() => setFilters((current) => ({ ...current, type: "parent" }))}>
                  Parent
                </Button>
                <Button type="button" variant={filters.type === "sub" ? "default" : "outline"} className="flex-1" onClick={() => setFilters((current) => ({ ...current, type: "sub" }))}>
                  Sub
                </Button>
              </div>
            </div>

            {catalog.loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="border-muted/20">
                    <TableHead className="px-6">{t("products.table.name")}</TableHead>
                    <TableHead>{t("common.category")}</TableHead>
                    <TableHead>{t("products.parent_product")}</TableHead>
                    <TableHead>{t("products.table.price")}</TableHead>
                    <TableHead>{t("products.table.stock")}</TableHead>
                    <TableHead className="px-6 text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center text-muted-foreground opacity-50">
                        {t("common.no_data")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const parent = product.ParentID ? products.find((candidate) => candidate.ID === product.ParentID) : null

                      return (
                        <TableRow key={product.ID} className="h-16 border-muted/10 transition-colors hover:bg-muted/5">
                          <TableCell className="px-6 font-medium">
                            <div className="flex flex-col">
                              <span className="font-semibold">{product.Name}</span>
                              <span className="text-[11px] text-muted-foreground">{getProductDisplayName(product, products)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="rounded-full bg-muted/20 px-2 py-0.5 text-[11px]">{product.CategoryName || parent?.CategoryName || t("common.no_category")}</span>
                          </TableCell>
                          <TableCell>{parent?.Name || product.ParentName || "-"}</TableCell>
                          <TableCell className="font-semibold">{product.Price}</TableCell>
                          <TableCell>{product.Stock}</TableCell>
                          <TableCell className="px-6 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/20">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => setDetailState({ open: true, item: product })}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t("common.details")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setEditState({
                                      open: true,
                                      source: product,
                                      data: toProductFormState(product),
                                      submitting: false,
                                    })
                                  }
                                >
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  {t("common.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500 focus:text-red-600" onClick={() => void handleDeleteProduct(product)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t("common.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </AdminTableCard>
        </div>
      </div>

      <Dialog open={detailState.open} onOpenChange={(open) => setDetailState((current) => ({ ...current, open }))}>
        <AdminDialogShell
          title={detailState.item ? getProductDisplayName(detailState.item, products) : t("common.details")}
          description={detailState.item?.Description || t("products.inventory_desc")}
          icon={ShoppingBag}
          className="max-w-5xl border-muted/30 bg-background/95 backdrop-blur-xl"
        >
          {detailState.item ? (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-muted/30 bg-muted/20 p-4 lg:grid-cols-4">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("common.category")}</p>
                  <p className="text-sm font-semibold">{detailState.item.CategoryName || t("common.no_category")}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("products.parent_product")}</p>
                  <p className="text-sm font-semibold">{products.find((product) => product.ID === detailState.item?.ParentID)?.Name || detailState.item.ParentName || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("products.table.price")}</p>
                  <p className="text-sm font-semibold">{detailState.item.Price}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("products.table.stock")}</p>
                  <p className="text-sm font-semibold">{detailState.item.Stock}</p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Package className="h-3 w-3" />
                    {t("common.details")}
                  </h4>
                  <div className="space-y-2">
                    {[...detailState.item.materials, ...detailState.item.models, ...detailState.item.filaments].length === 0 ? (
                      <div className="rounded-lg border border-dashed border-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
                        {t("common.no_data")}
                      </div>
                    ) : null}
                    {detailState.item.materials.map((relation) => (
                      <div key={`material-${relation.ID}`} className="flex items-center justify-between rounded-lg border border-muted/20 bg-background/70 p-2 text-xs">
                        <span>{relation.Name}</span>
                        <span className="font-semibold">{relation.Quantity}</span>
                      </div>
                    ))}
                    {detailState.item.models.map((relation) => (
                      <div key={`model-${relation.ID}`} className="flex items-center justify-between rounded-lg border border-muted/20 bg-background/70 p-2 text-xs">
                        <span>{relation.Name}</span>
                        <span className="font-semibold">{relation.Quantity}</span>
                      </div>
                    ))}
                    {detailState.item.filaments.map((relation) => (
                      <div key={`filament-${relation.ID}`} className="flex items-center justify-between rounded-lg border border-muted/20 bg-background/70 p-2 text-xs">
                        <span>{relation.Name}</span>
                        <span className="font-semibold">%{relation.Quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Box className="h-3 w-3" />
                    {t("models.details.preview")}
                  </h4>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {detailState.item.ImageFront ? (
                      <div className="overflow-hidden rounded-xl border border-muted/20 bg-muted/10">
                        <img src={detailState.item.ImageFront ? `${detailState.item.ImageFront}` : ""} alt="Front" className="aspect-square h-full w-full object-cover" />
                      </div>
                    ) : null}
                    {detailState.item.ImageBack ? (
                      <div className="overflow-hidden rounded-xl border border-muted/20 bg-muted/10">
                        <img src={detailState.item.ImageBack ? `${detailState.item.ImageBack}` : ""} alt="Back" className="aspect-square h-full w-full object-cover" />
                      </div>
                    ) : null}
                  </div>
                  {detailState.item.models.map((relation) => {
                    const model = catalog.models.find((entry) => entry.ID === relation.ModelID)
                    return (
                      <div key={`viewer-${relation.ID}`} className="space-y-2">
                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{relation.Name}</p>
                        <ModelViewer filePath={model?.FilePath} />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </AdminDialogShell>
      </Dialog>

      <Dialog open={editState.open} onOpenChange={(open) => setEditState((current) => ({ ...current, open }))}>
        <AdminDialogShell title={t("common.edit")} icon={Edit3} className="max-w-4xl border-muted/30 bg-background/95 backdrop-blur-xl">
          <ProductEditorForm
            draft={editState.data}
            onChange={(data) => setEditState((current) => ({ ...current, data }))}
            onSubmit={handleUpdate}
            submitting={editState.submitting}
            products={products}
            categories={catalog.categories}
            materials={catalog.materials}
            models={catalog.models}
            filaments={catalog.filaments}
            submitLabel={t("common.save")}
            onCancel={() => setEditState((current) => ({ ...current, open: false }))}
            currentProductId={editState.source?.ID}
          />
        </AdminDialogShell>
      </Dialog>
    </AdminPageShell>
  )
}
