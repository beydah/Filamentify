import * as React from "react"
import { useTranslation } from "react-i18next"
import { Box, Check, Edit3, ExternalLink, Eye, Loader2, MoreVertical, Plus, Trash2 } from "lucide-react"

import type { Category, Model, ModelFilters, ModelFormState } from "@/lib/admin-types"
import { apiFetch } from "@/lib/api"
import { createModelFormState, filterModels } from "@/lib/admin-logic.mjs"
import { useAdminCollection } from "@/hooks/use-admin-collection"
import { AdminDialogShell } from "@/ui/admin/admin-dialog-shell"
import { AdminPageShell } from "@/ui/admin/admin-page-shell"
import { AdminSectionCard } from "@/ui/admin/admin-section-card"
import { AdminTableCard } from "@/ui/admin/admin-table-card"
import { CategoryCard } from "@/ui/admin/CategoryCard"
import { EntitySelect } from "@/ui/admin/entity-select"
import { FileDropzone } from "@/ui/admin/file-dropzone"
import { ModelViewer } from "@/ui/admin/model-viewer"
import { Button } from "@/ui/controls/button"
import { Dialog, DialogFooter } from "@/ui/controls/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/controls/dropdown-menu"
import { Input } from "@/ui/controls/input"
import { Label } from "@/ui/controls/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/controls/table"
import { toast } from "sonner"

function fromModel(item: Model): ModelFormState {
  return {
    categoryId: String(item.CategoryID),
    name: item.Name,
    link: item.Link || "",
    gram: String(item.Gram),
    pieceCount: String(item.PieceCount || 1),
    file: null,
  }
}

export default function ModelsPage() {
  const { t } = useTranslation()
  const collection = useAdminCollection<Model, Category>({
    entityPath: "/api/models",
    categoryPath: "/api/model-categories",
  })

  const [formState, setFormState] = React.useState({
    data: createModelFormState(),
    submitting: false,
  })
  const [editState, setEditState] = React.useState({
    open: false,
    source: null as Model | null,
    data: createModelFormState(),
    submitting: false,
  })
  const [detailState, setDetailState] = React.useState({
    open: false,
    item: null as Model | null,
  })
  const [filters, setFilters] = React.useState<ModelFilters>({
    categoryId: "all",
  })
  const [selectState, setSelectState] = React.useState({
    formCategory: false,
    editCategory: false,
    filterCategory: false,
  })

  const models = collection.items
  const categories = collection.categories
  const filteredModels = React.useMemo(() => filterModels(models, filters), [models, filters])
  const categoryOptions = React.useMemo(
    () => categories.map((category) => ({ value: String(category.ID), label: category.Name })),
    [categories],
  )

  const validateModelFile = React.useCallback(
    (file: File) => {
      const valid = file.name.toLowerCase().endsWith(".stl")
      if (!valid) {
        toast.error(t("common.invalid_file_type"))
      }
      return valid
    },
    [t],
  )

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formState.data.name || !formState.data.categoryId || !formState.data.gram) {
      return
    }

    setFormState((current) => ({ ...current, submitting: true }))
    try {
      const body = new FormData()
      body.append("categoryId", formState.data.categoryId)
      body.append("name", formState.data.name)
      body.append("link", formState.data.link)
      body.append("gram", formState.data.gram)
      body.append("pieceCount", formState.data.pieceCount)
      if (formState.data.file) {
        body.append("file", formState.data.file)
      }

      await apiFetch("/api/models", {
        method: "POST",
        body,
      })
      toast.success(t("common.notifications.added"))
      setFormState({ data: createModelFormState(), submitting: false })
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
      const body = new FormData()
      body.append("categoryId", editState.data.categoryId)
      body.append("name", editState.data.name)
      body.append("link", editState.data.link)
      body.append("gram", editState.data.gram)
      body.append("pieceCount", editState.data.pieceCount)
      if (editState.data.file) {
        body.append("file", editState.data.file)
      }

      await apiFetch(`/api/models/${editState.source.ID}`, {
        method: "PATCH",
        body,
      })
      toast.success(t("common.notifications.updated"))
      setEditState({
        open: false,
        source: null,
        data: createModelFormState(),
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
    <AdminPageShell title={t("nav.models")}>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <AdminSectionCard title={t("models.new_record")} description={t("models.new_record_desc")} icon={Plus}>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("models.name")}</Label>
                <Input
                  value={formState.data.name}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, data: { ...current.data, name: event.target.value } }))
                  }
                  placeholder={t("models.name_placeholder")}
                  className="bg-background/40"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("models.category")}</Label>
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
                  <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("models.gram")}</Label>
                  <Input
                    type="number"
                    value={formState.data.gram}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, data: { ...current.data, gram: event.target.value } }))
                    }
                    className="bg-background/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("models.piece_count")}</Label>
                  <Input
                    type="number"
                    value={formState.data.pieceCount}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, data: { ...current.data, pieceCount: event.target.value } }))
                    }
                    className="bg-background/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("models.link")}</Label>
                <Input
                  value={formState.data.link}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, data: { ...current.data, link: event.target.value } }))
                  }
                  placeholder={t("models.link_placeholder")}
                  className="bg-background/40"
                />
              </div>

              <FileDropzone
                id="model-file"
                label={t("models.file_upload")}
                file={formState.data.file}
                accept=".stl"
                emptyTitle={t("models.drag_drop")}
                emptyHint={t("models.only_stl")}
                onChange={(file) => setFormState((current) => ({ ...current, data: { ...current.data, file } }))}
                validate={validateModelFile}
              />

              <Button type="submit" className="w-full gap-2" disabled={formState.submitting}>
                {formState.submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {t("models.save")}
              </Button>
            </form>
          </AdminSectionCard>

          <CategoryCard
            id="category-management"
            title={t("common.add_category")}
            description={t("models.categories_desc")}
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
            title={t("models.library")}
            description={t("models.library_desc")}
            icon={Box}
            countLabel={t("models.total")}
            count={models.length}
          >
            <div className="border-b border-muted/20 p-4">
              <EntitySelect
                open={selectState.filterCategory}
                onOpenChange={(open) => setSelectState((current) => ({ ...current, filterCategory: open }))}
                value={filters.categoryId}
                onChange={(value) => setFilters({ categoryId: value })}
                placeholder={t("models.category")}
                searchPlaceholder={t("common.search_category")}
                emptyLabel={t("common.category_not_found")}
                options={[{ value: "all", label: t("common.all") }, ...categoryOptions]}
              />
            </div>

            {collection.loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="border-muted/20">
                    <TableHead className="px-6">{t("models.table.name")}</TableHead>
                    <TableHead>{t("models.table.category")}</TableHead>
                    <TableHead>{t("models.table.gram")}</TableHead>
                    <TableHead>{t("models.table.piece_count")}</TableHead>
                    <TableHead>{t("models.table.link")}</TableHead>
                    <TableHead className="px-6 text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center text-muted-foreground opacity-50">
                        {t("common.no_data")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredModels.map((item) => (
                      <TableRow key={item.ID} className="h-16 border-muted/10 transition-colors hover:bg-muted/5">
                        <TableCell className="px-6 font-medium">{item.Name}</TableCell>
                        <TableCell>
                          <span className="rounded-full bg-muted/20 px-2 py-0.5 text-[11px]">{item.CategoryName || t("common.no_category")}</span>
                        </TableCell>
                        <TableCell>{Number(item.Gram).toFixed(2)}g</TableCell>
                        <TableCell>{item.PieceCount || 1}x</TableCell>
                        <TableCell>
                          {item.Link ? (
                            <a href={item.Link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                              <ExternalLink className="h-3 w-3" />
                              Link
                            </a>
                          ) : (
                            "-"
                          )}
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
                                    data: fromModel(item),
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
          description={t("models.details.desc")}
          icon={Box}
          className="max-w-4xl border-muted/30 bg-background/95 backdrop-blur-xl"
        >
          {detailState.item ? (
            <div className="grid gap-6 py-4 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-muted/30 bg-muted/20 p-4">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("models.category")}</p>
                    <p className="text-sm font-semibold">{detailState.item.CategoryName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("models.details.weight")}</p>
                    <p className="text-sm font-semibold">{detailState.item.Gram}g</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("models.table.piece_count")}</p>
                    <p className="text-sm font-semibold">{detailState.item.PieceCount}x</p>
                  </div>
                </div>
                <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                  <p className="text-[10px] font-bold tracking-widest text-primary/70">{t("models.table.link")}</p>
                  {detailState.item.Link ? (
                    <a href={detailState.item.Link} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
                      {detailState.item.Link}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-muted-foreground italic">{t("models.details.no_link")}</p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("models.details.preview")}</p>
                <ModelViewer filePath={detailState.item.FilePath} />
              </div>
            </div>
          ) : null}
        </AdminDialogShell>
      </Dialog>

      <Dialog open={editState.open} onOpenChange={(open) => setEditState((current) => ({ ...current, open }))}>
        <AdminDialogShell title={t("models.edit_dialog.title")} description={t("models.edit_dialog.desc")} icon={Edit3} className="max-w-xl border-muted/30 bg-background/95 backdrop-blur-xl">
          <form onSubmit={handleUpdate} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("models.name")}</Label>
              <Input
                value={editState.data.name}
                onChange={(event) =>
                  setEditState((current) => ({ ...current, data: { ...current.data, name: event.target.value } }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("models.category")}</Label>
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
                value={editState.data.gram}
                onChange={(event) =>
                  setEditState((current) => ({ ...current, data: { ...current.data, gram: event.target.value } }))
                }
              />
              <Input
                type="number"
                value={editState.data.pieceCount}
                onChange={(event) =>
                  setEditState((current) => ({ ...current, data: { ...current.data, pieceCount: event.target.value } }))
                }
              />
            </div>
            <FileDropzone
              id="edit-model-file"
              label={t("models.file_upload")}
              file={editState.data.file}
              accept=".stl"
              emptyTitle={t("models.drag_drop")}
              emptyHint={t("models.only_stl")}
              onChange={(file) => setEditState((current) => ({ ...current, data: { ...current.data, file } }))}
              validate={validateModelFile}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditState((current) => ({ ...current, open: false }))}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={editState.submitting}>
                {editState.submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                {t("models.edit_dialog.save")}
              </Button>
            </DialogFooter>
          </form>
        </AdminDialogShell>
      </Dialog>
    </AdminPageShell>
  )
}
