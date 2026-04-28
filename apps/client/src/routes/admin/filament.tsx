import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  Check,
  Database,
  Edit3,
  ExternalLink,
  Eye,
  Loader2,
  MoreVertical,
  Palette,
  Plus,
  Trash2,
} from "lucide-react"

import type { Category, Filament, FilamentFilters, FilamentFormState } from "@/lib/admin-types"
import { apiFetch, apiJsonBody } from "@/lib/api"
import { createFilamentFormState, filterFilaments, getFilamentStockStatus } from "@/lib/admin-logic.mjs"
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

const PRESET_COLORS = [
  "#000000",
  "#4b5563",
  "#ffffff",
  "#ef4444",
  "#ec4899",
  "#7c3aed",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#84cc16",
  "#f59e0b",
  "#f97316",
]

function toDateInputValue(date: Date) {
  return new Date(date).toISOString().slice(0, 10)
}

function fromFilament(item: Filament): FilamentFormState {
  return {
    categoryId: String(item.CategoryID),
    name: item.Name,
    color: item.Color,
    price: String(item.Price),
    gram: String(item.Gram),
    purchaseDate: item.PurchaseDate ? new Date(item.PurchaseDate) : new Date(),
    link: item.Link || "",
  }
}

function statusTone(status: "healthy" | "low" | "empty") {
  if (status === "empty") {
    return "bg-destructive/15 text-destructive"
  }

  if (status === "low") {
    return "bg-amber-500/15 text-amber-600 dark:text-amber-400"
  }

  return "bg-primary/15 text-primary"
}

export default function FilamentPage() {
  const { t } = useTranslation()
  const collection = useAdminCollection<Filament, Category>({
    entityPath: "/api/filaments",
    categoryPath: "/api/categories",
  })

  const [formState, setFormState] = React.useState({
    data: createFilamentFormState(),
    submitting: false,
  })
  const [editState, setEditState] = React.useState({
    open: false,
    source: null as Filament | null,
    data: createFilamentFormState(),
    submitting: false,
  })
  const [detailState, setDetailState] = React.useState({
    open: false,
    item: null as Filament | null,
  })
  const [filters, setFilters] = React.useState<FilamentFilters>({
    categoryId: "all",
    color: "all",
    stock: "all",
  })
  const [selectState, setSelectState] = React.useState({
    formCategory: false,
    editCategory: false,
    filterCategory: false,
    filterColor: false,
  })

  const categories = collection.categories
  const filaments = collection.items
  const uniqueColors = React.useMemo(() => Array.from(new Set(filaments.map((item) => item.Color).filter(Boolean))), [filaments])
  const filteredFilaments = React.useMemo(() => filterFilaments(filaments, filters), [filaments, filters])

  const categoryOptions = React.useMemo(
    () => categories.map((category) => ({ value: String(category.ID), label: category.Name })),
    [categories],
  )
  const colorOptions = React.useMemo(
    () => [{ value: "all", label: t("common.all") }, ...uniqueColors.map((color) => ({ value: color, label: color }))],
    [t, uniqueColors],
  )

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formState.data.name || !formState.data.categoryId) {
      return
    }

    setFormState((current) => ({ ...current, submitting: true }))
    try {
      await apiFetch("/api/filaments", {
        method: "POST",
        body: apiJsonBody({
          ...formState.data,
          purchaseDate: formState.data.purchaseDate.toISOString(),
        }),
      })
      toast.success(t("common.notifications.added"))
      setFormState({ data: createFilamentFormState(), submitting: false })
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
      await apiFetch(`/api/filaments/${editState.source.ID}`, {
        method: "PATCH",
        body: apiJsonBody({
          ...editState.data,
          purchaseDate: editState.data.purchaseDate.toISOString(),
        }),
      })
      toast.success(t("common.notifications.updated"))
      setEditState({
        open: false,
        source: null,
        data: createFilamentFormState(),
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
    <AdminPageShell title={t("nav.filament")}>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <AdminSectionCard title={t("filament.new_record")} description={t("filament.new_record_desc")} icon={Plus}>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("filament.name")}</Label>
                <Input
                  value={formState.data.name}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, data: { ...current.data, name: event.target.value } }))
                  }
                  placeholder={t("filament.name_placeholder")}
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
                  headerLabel={t("common.category")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("filament.color_selection")}</Label>
                <div className="flex items-center gap-3 rounded-xl border border-muted/20 bg-muted/10 p-3">
                  <Input
                    type="color"
                    value={formState.data.color}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, data: { ...current.data, color: event.target.value } }))
                    }
                    className="h-10 w-14 cursor-pointer border-0 bg-transparent p-1"
                  />
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={color}
                        className={cn(
                          "h-6 w-6 rounded-full border border-black/10 transition-transform hover:scale-110",
                          formState.data.color === color ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "",
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormState((current) => ({ ...current, data: { ...current.data, color } }))}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("filament.price")}</Label>
                  <Input
                    type="number"
                    value={formState.data.price}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, data: { ...current.data, price: event.target.value } }))
                    }
                    className="bg-background/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("filament.gram")}</Label>
                  <Input
                    type="number"
                    value={formState.data.gram}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, data: { ...current.data, gram: event.target.value } }))
                    }
                    className="bg-background/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("filament.purchase_date")}</Label>
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

              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("models.link")}</Label>
                <Input
                  value={formState.data.link}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, data: { ...current.data, link: event.target.value } }))
                  }
                  placeholder={t("filament.link_placeholder")}
                  className="bg-background/40"
                />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={formState.submitting}>
                {formState.submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {t("filament.save")}
              </Button>
            </form>
          </AdminSectionCard>

          <CategoryCard
            id="category-management"
            title={t("common.add_category")}
            description={t("filament.categories_desc")}
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
            title={t("filament.inventory")}
            description={t("filament.inventory_desc")}
            icon={Database}
            countLabel={t("filament.total")}
            count={filaments.length}
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
                  className="h-10"
                />
              </div>
              <div className="min-w-[160px] flex-1">
                <EntitySelect
                  open={selectState.filterColor}
                  onOpenChange={(open) => setSelectState((current) => ({ ...current, filterColor: open }))}
                  value={filters.color}
                  onChange={(value) => setFilters((current) => ({ ...current, color: value }))}
                  placeholder={t("filament.color_selection")}
                  searchPlaceholder={t("common.search")}
                  emptyLabel={t("common.no_data")}
                  options={colorOptions}
                  className="h-10"
                />
              </div>
              <div className="flex min-w-[160px] flex-1 gap-2">
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
                  variant={filters.stock === "low" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setFilters((current) => ({ ...current, stock: "low" }))}
                >
                  {t("filament.status.low_stock")}
                </Button>
                <Button
                  type="button"
                  variant={filters.stock === "empty" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setFilters((current) => ({ ...current, stock: "empty" }))}
                >
                  {t("filament.status.empty")}
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
                    <TableHead className="px-6">{t("filament.table.name")}</TableHead>
                    <TableHead>{t("filament.table.category")}</TableHead>
                    <TableHead>{t("filament.table.color")}</TableHead>
                    <TableHead>{t("filament.table.available")}</TableHead>
                    <TableHead>{t("filament.table.price")}</TableHead>
                    <TableHead className="px-6 text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFilaments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center text-muted-foreground opacity-50">
                        {t("common.no_data")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFilaments.map((item) => {
                      const stockStatus = getFilamentStockStatus(item)

                      return (
                        <TableRow key={item.ID} className="h-16 border-muted/10 transition-colors hover:bg-muted/5">
                          <TableCell className="px-6 font-medium">{item.Name}</TableCell>
                          <TableCell>
                            <span className="rounded-full bg-muted/20 px-2 py-0.5 text-[11px]">{item.CategoryName || t("common.no_category")}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: item.Color }} />
                              <span className="text-xs">{item.Color}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", statusTone(stockStatus))}>
                                {stockStatus === "healthy"
                                  ? t("filament.status.in_stock")
                                  : stockStatus === "low"
                                    ? t("filament.status.low_stock")
                                    : t("filament.status.empty")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {item.Available_Gram}/{item.Gram}g
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{item.Price}</TableCell>
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
                                      data: fromFilament(item),
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
          title={detailState.item?.Name || t("common.details")}
          description={t("filament.details.desc")}
          icon={Palette}
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
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("filament.details.price")}</p>
                  <p className="text-sm font-semibold">{detailState.item.Price}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("filament.details.color")}</p>
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: detailState.item.Color }} />
                    <span className="text-sm font-semibold">{detailState.item.Color}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("filament.details.status")}</p>
                  <p className="text-sm font-semibold">
                    {detailState.item.Available_Gram}/{detailState.item.Gram}g
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                <p className="text-[10px] font-bold tracking-widest text-primary/70">{t("filament.details.purchase_date")}</p>
                <p className="text-sm font-medium">{new Date(detailState.item.PurchaseDate).toLocaleDateString()}</p>
              </div>
              {detailState.item.Link ? (
                <a
                  href={detailState.item.Link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  {detailState.item.Link}
                </a>
              ) : null}
            </div>
          ) : null}
        </AdminDialogShell>
      </Dialog>

      <Dialog open={editState.open} onOpenChange={(open) => setEditState((current) => ({ ...current, open }))}>
        <AdminDialogShell
          title={t("filament.edit_dialog.title")}
          description={t("filament.edit_dialog.desc")}
          icon={Edit3}
          className="max-w-xl border-muted/30 bg-background/95 backdrop-blur-xl"
        >
          <form onSubmit={handleUpdate} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("filament.name")}</Label>
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
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("filament.price")}</Label>
                <Input
                  type="number"
                  value={editState.data.price}
                  onChange={(event) =>
                    setEditState((current) => ({ ...current, data: { ...current.data, price: event.target.value } }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("filament.gram")}</Label>
                <Input
                  type="number"
                  value={editState.data.gram}
                  onChange={(event) =>
                    setEditState((current) => ({ ...current, data: { ...current.data, gram: event.target.value } }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("filament.color_selection")}</Label>
              <Input
                type="color"
                value={editState.data.color}
                onChange={(event) =>
                  setEditState((current) => ({ ...current, data: { ...current.data, color: event.target.value } }))
                }
                className="h-11 w-full cursor-pointer bg-background/40 p-1"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditState((current) => ({ ...current, open: false }))}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={editState.submitting}>
                {editState.submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                {t("filament.edit_dialog.save")}
              </Button>
            </DialogFooter>
          </form>
        </AdminDialogShell>
      </Dialog>
    </AdminPageShell>
  )
}
