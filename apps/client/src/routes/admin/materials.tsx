import * as React from "react"
import { useTranslation } from "react-i18next"
import { Box, Check, Edit3, Eye, Loader2, MoreVertical, Plus, Trash2 } from "lucide-react"

import type { Category, Material, MaterialFilters, MaterialFormState } from "@/lib/admin-types"
import { apiFetch, apiJsonBody } from "@/lib/api"
import { createMaterialFormState, filterMaterials } from "@/lib/admin-logic.mjs"
import { cn } from "@/lib/utils"
import { useAdminCollection } from "@/hooks/use-admin-collection"
import { AdminDialogShell } from "@/ui/admin/admin-dialog-shell"
import { AdminPageShell } from "@/ui/admin/admin-page-shell"
import { AdminSectionCard } from "@/ui/admin/admin-section-card"
import { AdminTableCard } from "@/ui/admin/admin-table-card"
import { CategoryCard } from "@/ui/admin/CategoryCard"
import { EntitySelect } from "@/ui/admin/entity-select"
import { Button } from "@/ui/controls/button"
import { Dialog, DialogFooter } from "@/ui/controls/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/controls/dropdown-menu"
import { Input } from "@/ui/controls/input"
import { Label } from "@/ui/controls/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/controls/table"
import { toast } from "sonner"

function toDateInputValue(date: Date) {
  return new Date(date).toISOString().slice(0, 10)
}

function fromMaterial(item: Material): MaterialFormState {
  return {
    categoryId: String(item.CategoryID),
    name: item.Name,
    quantity: String(item.Quantity),
    totalPrice: String(item.TotalPrice),
    purchaseDate: item.PurchaseDate ? new Date(item.PurchaseDate) : new Date(),
    link: item.Link || "",
    usagePerUnit: String(item.UsagePerUnit ?? 0),
  }
}

export default function MaterialsPage() {
  const { t } = useTranslation()
  const collection = useAdminCollection<Material, Category>({
    entityPath: "/api/materials",
    categoryPath: "/api/material-categories",
  })

  const [formState, setFormState] = React.useState({
    data: createMaterialFormState(),
    submitting: false,
  })
  const [editState, setEditState] = React.useState({
    open: false,
    source: null as Material | null,
    data: createMaterialFormState(),
    submitting: false,
  })
  const [detailState, setDetailState] = React.useState({
    open: false,
    item: null as Material | null,
  })
  const [filters, setFilters] = React.useState<MaterialFilters>({
    categoryId: "all",
    stock: "all",
  })
  const [selectState, setSelectState] = React.useState({
    formCategory: false,
    editCategory: false,
    filterCategory: false,
  })

  const materials = collection.items
  const categories = collection.categories
  const filteredMaterials = React.useMemo(() => filterMaterials(materials, filters), [materials, filters])
  const categoryOptions = React.useMemo(
    () => categories.map((category) => ({ value: String(category.ID), label: category.Name })),
    [categories],
  )

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formState.data.name || !formState.data.categoryId) {
      return
    }

    setFormState((current) => ({ ...current, submitting: true }))
    try {
      await apiFetch("/api/materials", {
        method: "POST",
        body: apiJsonBody({
          ...formState.data,
          purchaseDate: formState.data.purchaseDate.toISOString(),
          quantity: Number(formState.data.quantity),
          totalPrice: Number(formState.data.totalPrice),
          usagePerUnit: Number(formState.data.usagePerUnit),
        }),
      })
      toast.success(t("common.notifications.added"))
      setFormState({ data: createMaterialFormState(), submitting: false })
      await collection.reload()
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
      await apiFetch(`/api/materials/${editState.source.ID}`, {
        method: "PATCH",
        body: apiJsonBody({
          ...editState.data,
          purchaseDate: editState.data.purchaseDate.toISOString(),
          quantity: Number(editState.data.quantity),
          totalPrice: Number(editState.data.totalPrice),
          usagePerUnit: Number(editState.data.usagePerUnit),
        }),
      })
      toast.success(t("common.notifications.updated"))
      setEditState({
        open: false,
        source: null,
        data: createMaterialFormState(),
        submitting: false,
      })
      await collection.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.notifications.delete_error"))
      setEditState((current) => ({ ...current, submitting: false }))
    }
  }

  const handleDeleteCategory = async (id: number) => {
    try {
      await collection.deleteCategory(id)
      toast.success(t("common.notifications.cat_deleted"))
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common.notifications.cat_delete_error")
      toast.error(message.includes("in use") ? t("common.notifications.cat_in_use") : message)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await collection.deleteItem(id)
      toast.success(t("common.notifications.deleted"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.notifications.delete_error"))
    }
  }

  return (
    <AdminPageShell title={t("nav.materials")}>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <AdminSectionCard title={t("materials.save")} description={t("materials.new_record_desc")} icon={Plus}>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("materials.name")}</Label>
                <Input
                  value={formState.data.name}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, data: { ...current.data, name: event.target.value } }))
                  }
                  placeholder={t("materials.name_placeholder")}
                  className="bg-background/40"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("common.category")}</Label>
                <EntitySelect
                  open={selectState.formCategory}
                  onOpenChange={(open) => setSelectState((current) => ({ ...current, formCategory: open }))}
                  value={formState.data.categoryId}
                  onChange={(value) => setFormState((current) => ({ ...current, data: { ...current.data, categoryId: value } }))}
                  placeholder={t("common.select_category")}
                  searchPlaceholder={t("common.search_category")}
                  emptyLabel={t("common.category_not_found")}
                  options={categoryOptions}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("materials.quantity")}</Label>
                  <Input
                    type="number"
                    value={formState.data.quantity}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, data: { ...current.data, quantity: event.target.value } }))
                    }
                    className="bg-background/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("materials.total_price")}</Label>
                  <Input
                    type="number"
                    value={formState.data.totalPrice}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, data: { ...current.data, totalPrice: event.target.value } }))
                    }
                    className="bg-background/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("common.usage_per_unit")}</Label>
                  <Input
                    type="number"
                    value={formState.data.usagePerUnit}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, data: { ...current.data, usagePerUnit: event.target.value } }))
                    }
                    className="bg-background/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("materials.purchase_date")}</Label>
                  <Input
                    type="date"
                    value={toDateInputValue(formState.data.purchaseDate)}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        data: { ...current.data, purchaseDate: new Date(`${event.target.value}T00:00:00`) },
                      }))
                    }
                    className="bg-background/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("materials.link")}</Label>
                <Input
                  value={formState.data.link}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, data: { ...current.data, link: event.target.value } }))
                  }
                  className="bg-background/40"
                />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={formState.submitting}>
                {formState.submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {t("materials.save")}
              </Button>
            </form>
          </AdminSectionCard>

          <CategoryCard
            id="category-management"
            title={t("common.add_category")}
            description={t("materials.categories_desc")}
            categories={categories}
            onAdd={async (name) => {
              try {
                await collection.createCategory(name)
                toast.success(t("common.notifications.added"))
              } catch (error) {
                toast.error(error instanceof Error ? error.message : t("common.notifications.cat_delete_error"))
              }
            }}
            onDelete={handleDeleteCategory}
            addingCategory={collection.addingCategory}
            deletingCategoryId={collection.deletingCategoryId}
          />
        </div>

        <div className="lg:col-span-8">
          <AdminTableCard
            title={t("materials.inventory")}
            description={t("materials.inventory_desc")}
            icon={Box}
            countLabel={t("filament.total")}
            count={materials.length}
          >
            <div className="flex flex-wrap gap-3 border-b border-muted/20 p-4">
              <div className="min-w-[180px] flex-1">
                <EntitySelect
                  open={selectState.filterCategory}
                  onOpenChange={(open) => setSelectState((current) => ({ ...current, filterCategory: open }))}
                  value={filters.categoryId}
                  onChange={(value) => setFilters((current) => ({ ...current, categoryId: value }))}
                  placeholder={t("common.category")}
                  searchPlaceholder={t("common.search_category")}
                  emptyLabel={t("common.category_not_found")}
                  options={[{ value: "all", label: t("common.all") }, ...categoryOptions]}
                />
              </div>
              <div className="flex min-w-[220px] flex-1 gap-2">
                <Button
                  type="button"
                  variant={filters.stock === "all" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setFilters((current) => ({ ...current, stock: "all" }))}
                >
                  {t("common.all")}
                </Button>
                <Button
                  type="button"
                  variant={filters.stock === "stock" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setFilters((current) => ({ ...current, stock: "stock" }))}
                >
                  {t("filament.status.in_stock")}
                </Button>
                <Button
                  type="button"
                  variant={filters.stock === "low" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setFilters((current) => ({ ...current, stock: "low" }))}
                >
                  {t("filament.status.low_stock")}
                </Button>
              </div>
            </div>

            {collection.loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="border-muted/20">
                    <TableHead className="px-6">{t("materials.name")}</TableHead>
                    <TableHead>{t("common.category")}</TableHead>
                    <TableHead>{t("materials.table.unit_price")}</TableHead>
                    <TableHead>{t("materials.table.unit_usage")}</TableHead>
                    <TableHead>{t("materials.table.current")}</TableHead>
                    <TableHead className="px-6 text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center text-muted-foreground opacity-50">
                        {t("common.no_data")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMaterials.map((item) => (
                      <TableRow key={item.ID} className="h-16 border-muted/10 transition-colors hover:bg-muted/5">
                        <TableCell className="px-6 font-medium">{item.Name}</TableCell>
                        <TableCell>
                          <span className="rounded-full bg-muted/20 px-2 py-0.5 text-[11px]">{item.CategoryName || t("common.no_category")}</span>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {item.Quantity > 0 ? (item.TotalPrice / item.Quantity).toFixed(2) : "0.00"}
                        </TableCell>
                        <TableCell>{item.UsagePerUnit}%</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              item.Quantity < 10 ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary",
                            )}
                          >
                            {item.Quantity}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/20">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => setDetailState({ open: true, item })}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t("common.details")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setEditState({
                                    open: true,
                                    source: item,
                                    data: fromMaterial(item),
                                    submitting: false,
                                  })
                                }
                              >
                                <Edit3 className="mr-2 h-4 w-4" />
                                {t("common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500 focus:text-red-600" onClick={() => void handleDelete(item.ID)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("common.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </AdminTableCard>
        </div>
      </div>

      <Dialog open={detailState.open} onOpenChange={(open) => setDetailState((current) => ({ ...current, open }))}>
        <AdminDialogShell
          title={detailState.item?.Name || t("common.details")}
          description={t("materials.inventory_desc")}
          icon={Box}
          className="max-w-xl border-muted/30 bg-background/95 backdrop-blur-xl"
        >
          {detailState.item ? (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-muted/30 bg-muted/20 p-4">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("common.category")}</p>
                  <p className="text-sm font-semibold">{detailState.item.CategoryName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("materials.quantity")}</p>
                  <p className="text-sm font-semibold">{detailState.item.Quantity}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("materials.total_price")}</p>
                  <p className="text-sm font-semibold">{detailState.item.TotalPrice}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("materials.table.unit_price")}</p>
                  <p className="text-sm font-semibold">
                    {detailState.item.Quantity > 0 ? (detailState.item.TotalPrice / detailState.item.Quantity).toFixed(2) : "0.00"}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                <p className="text-[10px] font-bold tracking-widest text-primary/70">{t("common.registration_date")}</p>
                <p className="text-sm font-medium">{new Date(detailState.item.PurchaseDate).toLocaleDateString()}</p>
              </div>
            </div>
          ) : null}
        </AdminDialogShell>
      </Dialog>

      <Dialog open={editState.open} onOpenChange={(open) => setEditState((current) => ({ ...current, open }))}>
        <AdminDialogShell title={t("common.edit")} icon={Edit3} className="max-w-xl border-muted/30 bg-background/95 backdrop-blur-xl">
          <form onSubmit={handleUpdate} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("materials.name")}</Label>
              <Input
                value={editState.data.name}
                onChange={(event) =>
                  setEditState((current) => ({ ...current, data: { ...current.data, name: event.target.value } }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("common.category")}</Label>
              <EntitySelect
                open={selectState.editCategory}
                onOpenChange={(open) => setSelectState((current) => ({ ...current, editCategory: open }))}
                value={editState.data.categoryId}
                onChange={(value) => setEditState((current) => ({ ...current, data: { ...current.data, categoryId: value } }))}
                placeholder={t("common.select_category")}
                searchPlaceholder={t("common.search_category")}
                emptyLabel={t("common.category_not_found")}
                options={categoryOptions}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                value={editState.data.quantity}
                onChange={(event) =>
                  setEditState((current) => ({ ...current, data: { ...current.data, quantity: event.target.value } }))
                }
              />
              <Input
                type="number"
                value={editState.data.totalPrice}
                onChange={(event) =>
                  setEditState((current) => ({ ...current, data: { ...current.data, totalPrice: event.target.value } }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                value={editState.data.usagePerUnit}
                onChange={(event) =>
                  setEditState((current) => ({ ...current, data: { ...current.data, usagePerUnit: event.target.value } }))
                }
              />
              <Input
                type="date"
                value={toDateInputValue(editState.data.purchaseDate)}
                onChange={(event) =>
                  setEditState((current) => ({
                    ...current,
                    data: { ...current.data, purchaseDate: new Date(`${event.target.value}T00:00:00`) },
                  }))
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditState((current) => ({ ...current, open: false }))}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={editState.submitting}>
                {editState.submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </AdminDialogShell>
      </Dialog>
    </AdminPageShell>
  )
}
