import * as React from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Plus } from "lucide-react"

import type { Filament, Material, Model, Product, ProductCategory, ProductFormState } from "@/lib/admin-types"
import { EntitySelect } from "@/ui/admin/entity-select"
import { ImageUploadField } from "@/ui/admin/image-upload-field"
import { RelationPicker } from "@/ui/admin/relation-picker"
import { Button } from "@/ui/controls/button"
import { Checkbox } from "@/ui/controls/checkbox"
import { Input } from "@/ui/controls/input"
import { Label } from "@/ui/controls/label"

interface ProductEditorFormProps {
  draft: ProductFormState
  onChange: (draft: ProductFormState) => void
  onSubmit: (event: React.FormEvent) => void
  submitting: boolean
  products: Product[]
  categories: ProductCategory[]
  materials: Material[]
  models: Model[]
  filaments: Filament[]
  submitLabel: string
  onCancel?: () => void
  currentProductId?: number
}

export function ProductEditorForm({
  draft,
  onChange,
  onSubmit,
  submitting,
  products,
  categories,
  materials,
  models,
  filaments,
  submitLabel,
  onCancel,
  currentProductId,
}: ProductEditorFormProps) {
  const { t } = useTranslation()
  const [subProductOverride, setSubProductOverride] = React.useState<boolean | null>(null)
  const isSubProduct = subProductOverride !== null ? subProductOverride : Boolean(draft.parentId)
  const setIsSubProduct = React.useCallback((value: boolean) => setSubProductOverride(value), [])
  const [selectState, setSelectState] = React.useState({
    parent: false,
    category: false,
  })

  const parentOptions = React.useMemo(
    () =>
      products
        .filter((product) => !product.ParentID && product.ID !== currentProductId)
        .map((product) => ({
          value: String(product.ID),
          label: product.Name,
          meta: product.CategoryName || t("common.no_category"),
        })),
    [currentProductId, products, t],
  )

  const categoryOptions = React.useMemo(
    () =>
      categories.map((category) => ({
        value: String(category.ID),
        label: category.Name,
      })),
    [categories],
  )

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center space-x-2 rounded-lg border border-muted/10 bg-muted/20 p-2">
        <Checkbox
          id="sub-product"
          checked={isSubProduct}
          onCheckedChange={(checked) => {
            const nextValue = Boolean(checked)
            setIsSubProduct(nextValue)
            if (!nextValue) {
              onChange({ ...draft, parentId: "" })
            }
          }}
        />
        <Label htmlFor="sub-product" className="cursor-pointer text-xs font-bold">
          {t("products.sub_product")}
        </Label>
      </div>

      {isSubProduct ? (
        <div className="space-y-2">
          <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("products.parent_product")}</Label>
          <EntitySelect
            open={selectState.parent}
            onOpenChange={(open) => setSelectState((current) => ({ ...current, parent: open }))}
            value={draft.parentId}
            onChange={(value) => onChange({ ...draft, parentId: value })}
            placeholder={t("common.select")}
            searchPlaceholder={t("common.search")}
            emptyLabel={t("common.no_data")}
            options={parentOptions}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("products.name")}</Label>
        <Input value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} placeholder={t("products.name_placeholder")} />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("products.description")}</Label>
        <textarea
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("common.category")}</Label>
        <EntitySelect
          open={selectState.category}
          onOpenChange={(open) => setSelectState((current) => ({ ...current, category: open }))}
          value={draft.categoryId}
          onChange={(value) => onChange({ ...draft, categoryId: value })}
          placeholder={t("common.select_category")}
          searchPlaceholder={t("common.search_category")}
          emptyLabel={t("common.category_not_found")}
          options={categoryOptions}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("products.price")}</Label>
          <Input type="number" value={draft.price} onChange={(event) => onChange({ ...draft, price: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("products.stock")}</Label>
          <Input type="number" value={draft.stock} onChange={(event) => onChange({ ...draft, stock: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("common.multiplier")}</Label>
          <Input type="number" step="0.1" value={draft.profitMultiplier} onChange={(event) => onChange({ ...draft, profitMultiplier: event.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ImageUploadField
          id="product-image-front"
          label={t("products.image_front")}
          file={draft.imageFront}
          onChange={(imageFront) => onChange({ ...draft, imageFront })}
          invalidTypeMessage={t("common.invalid_file_type")}
        />
        <ImageUploadField
          id="product-image-back"
          label={t("products.image_back")}
          file={draft.imageBack}
          onChange={(imageBack) => onChange({ ...draft, imageBack })}
          invalidTypeMessage={t("common.invalid_file_type")}
        />
      </div>

      <RelationPicker
        title={t("products.select_materials")}
        addLabel={t("products.add_material")}
        searchPlaceholder={t("common.search")}
        emptyLabel={t("common.no_data")}
        values={draft.selectedMaterials}
        options={materials.map((material) => ({
          id: material.ID,
          name: material.Name,
          meta: material.CategoryName,
        }))}
        onChange={(selectedMaterials) => onChange({ ...draft, selectedMaterials })}
        quantityLabel="Qty"
      />

      <RelationPicker
        title={t("products.select_models")}
        addLabel={t("products.add_model")}
        searchPlaceholder={t("common.search")}
        emptyLabel={t("common.no_data")}
        values={draft.selectedModels}
        options={models.map((model) => ({
          id: model.ID,
          name: model.Name,
          meta: `${model.Gram}g`,
        }))}
        onChange={(selectedModels) => onChange({ ...draft, selectedModels })}
        quantityLabel="Qty"
      />

      <RelationPicker
        title={t("products.select_filaments")}
        addLabel={t("products.add_filament")}
        searchPlaceholder={t("common.search")}
        emptyLabel={t("common.no_data")}
        values={draft.selectedFilaments}
        options={filaments.map((filament) => ({
          id: filament.ID,
          name: filament.Name,
          meta: filament.Color,
        }))}
        onChange={(selectedFilaments) => onChange({ ...draft, selectedFilaments })}
        quantityLabel="%"
        quantityMin={0}
        quantityMax={100}
        suffix="%"
      />

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
