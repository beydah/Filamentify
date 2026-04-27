export interface Category {
  ID: number
  Name: string
}

export interface Filament {
  ID: number
  CategoryID: number
  CategoryName: string
  Name: string
  Color: string
  Price: number
  Gram: number
  Available_Gram: number
  PurchaseDate: string
  Status: string
  Link?: string | null
}

export interface Model {
  ID: number
  CategoryID: number
  CategoryName: string
  Name: string
  Link?: string | null
  Gram: number
  PieceCount: number
  FilePath?: string | null
}

export interface Material {
  ID: number
  CategoryID: number
  CategoryName: string
  Name: string
  Quantity: number
  TotalPrice: number
  Link?: string | null
  PurchaseDate: string
  UsagePerUnit: number
}

export interface ProductRelation {
  ID: number
  Name: string
  Quantity: number
  ModelID?: number
  MaterialID?: number
  FilamentID?: number
}

export interface ProductCategory {
  ID: number
  Name: string
}

export interface Product {
  ID: number
  Name: string
  Description: string
  Price: number
  Stock: number
  ImageFront?: string | null
  ImageBack?: string | null
  ProfitMultiplier: number
  ParentID?: number | null
  ParentName?: string | null
  CategoryID?: number | null
  CategoryName?: string | null
  materials: ProductRelation[]
  models: ProductRelation[]
  filaments: ProductRelation[]
}
