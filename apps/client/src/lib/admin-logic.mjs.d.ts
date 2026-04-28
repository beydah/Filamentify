import type {
  Filament,
  FilamentFilters,
  FilamentFormState,
  Material,
  MaterialFilters,
  MaterialFormState,
  Model,
  ModelFilters,
  ModelFormState,
  Product,
  ProductFormState,
  RelationDraft,
} from "./admin-types"

export function createFilamentFormState(): FilamentFormState
export function createMaterialFormState(): MaterialFormState
export function createModelFormState(): ModelFormState
export function createProductFormState(): ProductFormState
export function getFilamentStockStatus(filament: Filament): "empty" | "low" | "healthy"
export function filterFilaments(filaments: Filament[], filters: FilamentFilters): Filament[]
export function filterMaterials(materials: Material[], filters: MaterialFilters): Material[]
export function filterModels(models: Model[], filters: ModelFilters): Model[]
export function toRelationDrafts(relations?: Array<{ ID: number; Quantity: number }>): RelationDraft[]
export function serializeProductDraft(draft: ProductFormState): {
  name: string
  description: string
  price: string
  stock: string
  profitMultiplier: string
  parentId: string
  categoryId: string
  materials: string
  models: string
  filaments: string
}
export function toProductFormState(product: Product | null | undefined): ProductFormState
export function getProductDisplayName(product: Product | null | undefined, products?: Product[]): string
