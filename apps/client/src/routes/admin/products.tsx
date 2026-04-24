import * as React from "react"
import { useTranslation } from "react-i18next"
import { 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  Trash2,
  MoreVertical,
  ShoppingBag,
  Eye,
  Edit3,
  Image as ImageIcon,
  DollarSign,
  Package,
  Layers,
  Box,
  TrendingUp,
  X,
  Check,
  ChevronsUpDown,
  Tag
} from "lucide-react"
import { Button } from "@/ui/controls/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/controls/card"
import { cn } from "@/lib/utils"
import { Input } from "@/ui/controls/input"
import { Label } from "@/ui/controls/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/controls/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/controls/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/controls/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/ui/controls/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/controls/popover"
import { toast } from "sonner"

interface Material {
  ID: number
  Name: string
}

interface Model {
  ID: number
  Name: string
}

interface ProductDetail {
  ID: number
  Name: string
  Quantity: number
}

interface Filament {
  ID: number
  Name: string
}

interface ProductCategory {
  ID: number
  Name: string
}

interface Product {
  ID: number
  Name: string
  Description: string
  Price: number
  Stock: number
  ImageFront: string
  ImageBack: string
  ProfitMultiplier: number
  ParentID?: number
  CategoryID?: number
  CategoryName?: string
  materials: ProductDetail[]
  models: ProductDetail[]
  filaments: ProductDetail[]
}

export default function ProductsPage() {
  const { t } = useTranslation()
  const [isFormOpen, setIsFormOpen] = React.useState(true)
  const [products, setProducts] = React.useState<Product[]>([])
  const [materials, setMaterials] = React.useState<Material[]>([])
  const [models, setModels] = React.useState<Model[]>([])
  const [filaments, setFilaments] = React.useState<Filament[]>([])
  const [categories, setCategories] = React.useState<ProductCategory[]>([])
  const [isCategoriesOpen, setIsCategoriesOpen] = React.useState(false)
  const [newCategory, setNewCategory] = React.useState("")
  const [addingCategory, setAddingCategory] = React.useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = React.useState<number | null>(null)
  const [isSubProduct, setIsSubProduct] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)

  // Form State
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    price: "0",
    stock: "0",
    profitMultiplier: "1.5",
    parentId: "",
    categoryId: "",
    imageFront: null as File | null,
    imageBack: null as File | null,
    selectedMaterials: [] as { id: number, quantity: number }[],
    selectedModels: [] as { id: number, quantity: number }[],
    selectedFilaments: [] as { id: number, quantity: number }[]
  })

  // Edit State
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
  const [originalProduct, setOriginalProduct] = React.useState<Product | null>(null)
  const [editFormData, setEditFormData] = React.useState({
    name: "",
    description: "",
    price: "0",
    stock: "0",
    profitMultiplier: "1.5",
    parentId: "",
    categoryId: "",
    imageFront: null as File | null,
    imageBack: null as File | null,
    selectedMaterials: [] as { id: number, quantity: number }[],
    selectedModels: [] as { id: number, quantity: number }[],
    selectedFilaments: [] as { id: number, quantity: number }[]
  })
  const [updating, setUpdating] = React.useState(false)

  // Fetch Data
  const fetchData = React.useCallback(async () => {
    try {
      const [prodRes, matRes, modRes, filRes, catRes] = await Promise.all([
        fetch("http://localhost:3001/api/products"),
        fetch("http://localhost:3001/api/materials"),
        fetch("http://localhost:3001/api/models"),
        fetch("http://localhost:3001/api/filaments"),
        fetch("http://localhost:3001/api/product-categories")
      ])
      const [prodData, matData, modData, filData, catData] = await Promise.all([
        prodRes.json(),
        matRes.json(),
        modRes.json(),
        filRes.json(),
        catRes.json()
      ])
      setProducts(prodData)
      setMaterials(matData)
      setModels(modData)
      setFilaments(filData)
      setCategories(catData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return
    setSubmitting(true)
    
    const body = new FormData()
    body.append("name", formData.name)
    body.append("description", formData.description)
    body.append("price", formData.price)
    body.append("stock", formData.stock)
    body.append("profitMultiplier", formData.profitMultiplier)
    if (formData.imageFront) body.append("imageFront", formData.imageFront)
    if (formData.imageBack) body.append("imageBack", formData.imageBack || "")
    body.append("materials", JSON.stringify(formData.selectedMaterials))
    body.append("models", JSON.stringify(formData.selectedModels))
    body.append("filaments", JSON.stringify(formData.selectedFilaments))
    body.append("parentId", formData.parentId)
    body.append("categoryId", formData.categoryId)

    try {
      const response = await fetch("http://localhost:3001/api/products", {
        method: "POST",
        body
      })
      if (response.ok) {
        toast.success(t("common.notifications.added"))
        setFormData({
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
          selectedFilaments: []
        })
        setIsSubProduct(false)
        fetchData()
      }
    } catch (error) {
      console.error(error)
      toast.error(t("common.notifications.add_error"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    const body = new FormData()
    body.append("name", editFormData.name)
    body.append("description", editFormData.description)
    body.append("price", editFormData.price)
    body.append("stock", editFormData.stock)
    body.append("profitMultiplier", editFormData.profitMultiplier)
    body.append("imageFront", editFormData.imageFront || "")
    body.append("imageBack", editFormData.imageBack || "")
    body.append("materials", JSON.stringify(editFormData.selectedMaterials))
    body.append("models", JSON.stringify(editFormData.selectedModels))
    body.append("filaments", JSON.stringify(editFormData.selectedFilaments))
    body.append("parentId", editFormData.parentId)
    body.append("categoryId", editFormData.categoryId)

    try {
      const response = await fetch(`http://localhost:3001/api/products/${selectedProduct?.ID}`, {
        method: "PATCH",
        body
      })
      if (response.ok) {
        toast.success(t("common.notifications.updated"))
        setIsEditOpen(false)
        fetchData()
      }
    } catch (error) {
      console.error(error)
      toast.error(t("common.notifications.update_error"))
    } finally {
      setUpdating(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    setAddingCategory(true)
    try {
      const response = await fetch("http://localhost:3001/api/product-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory })
      })
      if (response.ok) {
        setNewCategory("")
        fetchData()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setAddingCategory(false)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    setDeletingCategoryId(id)
    try {
      const response = await fetch(`http://localhost:3001/api/product-categories/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success(t("common.notifications.cat_deleted"))
        fetchData()
      } else {
        const error = await response.json()
        if (error.error === "Category is in use and cannot be deleted") {
          toast.error(t("common.notifications.cat_in_use"))
        } else {
          toast.error(error.error || t("common.notifications.cat_delete_error"))
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setDeletingCategoryId(null)
    }
  }

  const handleDeleteProduct = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/products/${id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        toast.success(t("common.notifications.deleted"))
        fetchData()
      }
    } catch (error) {
      console.error("Failed to delete product:", error)
    }
  }

  const handleEditClick = (p: Product) => {
    setSelectedProduct(p)
    setOriginalProduct(p)
    setEditFormData({
      name: p.Name,
      description: p.Description || "",
      price: p.Price.toString(),
      stock: p.Stock.toString(),
      profitMultiplier: p.ProfitMultiplier?.toString() || "1.5",
      parentId: p.ParentID?.toString() || "",
      categoryId: p.CategoryID?.toString() || "",
      imageFront: null,
      imageBack: null,
      selectedMaterials: p.materials?.map(m => ({ id: m.ID, quantity: m.Quantity })) || [],
      selectedModels: p.models?.map(m => ({ id: m.ID, quantity: m.Quantity })) || [],
      selectedFilaments: p.filaments?.map(f => ({ id: f.ID, quantity: f.Quantity })) || []
    })
    setIsEditOpen(true)
  }

  const isFieldChanged = (field: string, value: any) => {
    if (!originalProduct) return false
    switch (field) {
      case "name": return value !== originalProduct.Name
      case "description": return value !== (originalProduct.Description || "")
      case "price": return value !== originalProduct.Price.toString()
      case "stock": return value !== originalProduct.Stock.toString()
      case "profitMultiplier": return value !== (originalProduct.ProfitMultiplier?.toString() || "1.5")
      case "parentId": return value !== (originalProduct.ParentID?.toString() || "")
      case "categoryId": return value !== (originalProduct.CategoryID?.toString() || "")
      case "imageFront": return value !== null
      case "imageBack": return value !== null
      case "materials": return JSON.stringify(value) !== JSON.stringify(originalProduct.materials?.map(m => ({ id: m.ID, quantity: m.Quantity })) || [])
      case "models": return JSON.stringify(value) !== JSON.stringify(originalProduct.models?.map(m => ({ id: m.ID, quantity: m.Quantity })) || [])
      case "filaments": return JSON.stringify(value) !== JSON.stringify(originalProduct.filaments?.map(f => ({ id: f.ID, quantity: f.Quantity })) || [])
      default: return false
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {t("nav.products")}
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Column: Form & Category Management */}
        <div className="xl:col-span-1 space-y-8">
          {/* Add Category Section */}
          <Card id="category-management" className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  {t("common.add_category")}
                </CardTitle>
                <CardDescription>
                  {t("products.categories_desc")}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="h-8 w-8 p-0"
              >
                {isCategoriesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <div className={cn(
              "grid transition-all duration-300 ease-in-out",
              isCategoriesOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}>
              <div className="overflow-hidden">
                <CardContent className="pb-6">
                  <form onSubmit={handleAddCategory} className="flex gap-2">
                    <Input
                      placeholder={t("filament.add_category_placeholder")}
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="bg-background/40 border-muted/30"
                    />
                    <Button type="submit" size="icon" disabled={addingCategory || !newCategory.trim()}>
                      {addingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </form>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <div key={cat.ID} className="group flex items-center gap-1 bg-background/60 border border-muted/20 px-2 py-1 rounded-md hover:border-primary/30 transition-all">
                        <span className="text-xs font-medium">{cat.Name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-all"
                          onClick={() => handleDeleteCategory(cat.ID)}
                          disabled={deletingCategoryId === cat.ID}
                        >
                          {deletingCategoryId === cat.ID ? <Loader2 className="h-2 w-2 animate-spin" /> : <X className="h-2 w-2" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>

          {/* Add Product Form */}
          <Card className="border-muted/40 bg-card/40 backdrop-blur-md shadow-xl overflow-hidden transition-all duration-300">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  {t("products.new_record")}
                </CardTitle>
                <CardDescription>
                  {t("products.new_record_desc")}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="h-8 w-8 p-0"
              >
                {isFormOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <div className={cn(
              "grid transition-all duration-300 ease-in-out",
              isFormOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}>
              <div className="overflow-hidden">
                <CardContent className="pb-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      {/* Sub-product radio toggle */}
                      <div className="flex gap-4 p-2 bg-muted/20 rounded-lg border border-muted/10">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="type-main"
                            name="product-type"
                            checked={!isSubProduct}
                            onChange={() => setIsSubProduct(false)}
                            className="w-4 h-4 accent-primary cursor-pointer"
                          />
                          <Label htmlFor="type-main" className="text-xs font-bold cursor-pointer">{t("products.inventory")}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="type-sub"
                            name="product-type"
                            checked={isSubProduct}
                            onChange={() => setIsSubProduct(true)}
                            className="w-4 h-4 accent-primary cursor-pointer"
                          />
                          <Label htmlFor="type-sub" className="text-xs font-bold cursor-pointer">{t("products.sub_product")}</Label>
                        </div>
                      </div>

                      {isSubProduct && (
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.parent_product")}</Label>
                          <Popover open={openCategory} onOpenChange={setOpenCategory}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCategory}
                                className="w-full justify-between bg-background/40 border-muted/30 h-10 text-xs"
                              >
                                {formData.parentId
                                  ? products.find((p) => p.ID.toString() === formData.parentId)?.Name
                                  : t("common.select")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[250px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder={t("common.search")} />
                                <CommandList>
                                  <CommandEmpty>{t("common.no_data")}</CommandEmpty>
                                  <CommandGroup>
                                    {products.filter(p => !p.ParentID).map((p) => (
                                      <CommandItem
                                        key={p.ID}
                                        value={p.Name}
                                        onSelect={() => {
                                          setFormData({ ...formData, parentId: p.ID.toString() })
                                          setOpenCategory(false)
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", formData.parentId === p.ID.toString() ? "opacity-100" : "opacity-0")} />
                                        {p.Name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.name")}</Label>
                        <Input
                          placeholder={t("products.name")}
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="bg-background/40 border-muted/30 h-10"
                        />
                      </div>

                      {!isSubProduct && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.description")}</Label>
                            <Input
                              placeholder={t("products.description")}
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              className="bg-background/40 border-muted/30 h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.profit_multiplier")}</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.profitMultiplier}
                              onChange={(e) => setFormData({ ...formData, profitMultiplier: e.target.value })}
                              className="bg-background/40 border-muted/30 h-10"
                            />
                          </div>
                        </>
                      )}

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("common.category")}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between h-10 bg-background/40 border-muted/30 text-xs">
                              {categories.find(c => c.ID.toString() === formData.categoryId)?.Name || t("common.select")}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder={t("common.search")} />
                              <CommandList>
                                <CommandEmpty>{t("common.no_data")}</CommandEmpty>
                                <CommandGroup>
                                  {categories.map((cat) => (
                                    <CommandItem
                                      key={cat.ID}
                                      onSelect={() => setFormData({ ...formData, categoryId: cat.ID.toString() })}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", formData.categoryId === cat.ID.toString() ? "opacity-100" : "opacity-0")} />
                                      {cat.Name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.image_front")}</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFormData({ ...formData, imageFront: e.target.files?.[0] || null })}
                          className="bg-background/40 border-muted/30 h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.image_back")}</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFormData({ ...formData, imageBack: e.target.files?.[0] || null })}
                          className="bg-background/40 border-muted/30 h-10"
                        />
                      </div>
                    </div>

                    {!isSubProduct && (
                      <div className="space-y-4">
                        {/* Filament Selection */}
                        <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-muted/10">
                          <Label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Box className="h-3 w-3 text-primary" />
                            {t("products.select_filaments")}
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between h-9 text-xs">
                                {t("products.add_filament")}
                                <Plus className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[250px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder={t("common.search")} />
                                <CommandList>
                                  <CommandEmpty>{t("common.no_data")}</CommandEmpty>
                                  <CommandGroup>
                                    {filaments.map(f => (
                                      <CommandItem
                                        key={f.ID}
                                        onSelect={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            selectedFilaments: [...prev.selectedFilaments, { id: f.ID, quantity: 100 }]
                                          }))
                                        }}
                                      >
                                        {f.Name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <div className="space-y-2">
                            {formData.selectedFilaments.map((sf, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-background/60 p-2 rounded-lg border border-muted/10">
                                <span className="text-xs font-medium flex-1 truncate">
                                  {filaments.find(f => f.ID === sf.id)?.Name}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Input 
                                    type="number" 
                                    className="w-16 h-7 text-xs px-1 text-left" 
                                    value={sf.quantity}
                                    onChange={(e) => {
                                      const newFils = [...formData.selectedFilaments]
                                      newFils[idx].quantity = parseInt(e.target.value) || 1
                                      setFormData({ ...formData, selectedFilaments: newFils })
                                    }}
                                  />
                                  <span className="text-[10px] text-muted-foreground">gr</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => setFormData({ ...formData, selectedFilaments: formData.selectedFilaments.filter((_, i) => i !== idx) })}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Material Selection */}
                        <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-muted/10">
                          <Label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Layers className="h-3 w-3 text-primary" />
                            {t("products.select_materials")}
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between h-9 text-xs">
                                {t("products.add_material")}
                                <Plus className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[250px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder={t("common.search")} />
                                <CommandList>
                                  <CommandEmpty>{t("common.no_data")}</CommandEmpty>
                                  <CommandGroup>
                                    {materials.map(m => (
                                      <CommandItem
                                        key={m.ID}
                                        onSelect={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            selectedMaterials: [...prev.selectedMaterials, { id: m.ID, quantity: 1 }]
                                          }))
                                        }}
                                      >
                                        {m.Name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          
                          <div className="space-y-2">
                            {formData.selectedMaterials.map((sm, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-background/60 p-2 rounded-lg border border-muted/10">
                                <span className="text-xs font-medium flex-1 truncate">
                                  {materials.find(m => m.ID === sm.id)?.Name}
                                </span>
                                <Input 
                                  type="number" 
                                  className="w-16 h-7 text-xs px-1 text-left" 
                                  value={sm.quantity}
                                  onChange={(e) => {
                                    const newMats = [...formData.selectedMaterials]
                                    newMats[idx].quantity = parseInt(e.target.value) || 1
                                    setFormData({ ...formData, selectedMaterials: newMats })
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => setFormData({ ...formData, selectedMaterials: formData.selectedMaterials.filter((_, i) => i !== idx) })}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Model Selection */}
                        <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-muted/10">
                          <Label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-primary" />
                            {t("products.select_models")}
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between h-9 text-xs">
                                {t("products.add_model")}
                                <Plus className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[250px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder={t("common.search")} />
                                <CommandList>
                                  <CommandEmpty>{t("common.no_data")}</CommandEmpty>
                                  <CommandGroup>
                                    {models.map(m => (
                                      <CommandItem
                                        key={m.ID}
                                        onSelect={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            selectedModels: [...prev.selectedModels, { id: m.ID, quantity: 1 }]
                                          }))
                                        }}
                                      >
                                        {m.Name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>

                          <div className="space-y-2">
                            {formData.selectedModels.map((sm, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-background/60 p-2 rounded-lg border border-muted/10">
                                <span className="text-xs font-medium flex-1 truncate">
                                  {models.find(m => m.ID === sm.id)?.Name}
                                </span>
                                <Input 
                                  type="number" 
                                  className="w-16 h-7 text-xs px-1 text-left" 
                                  value={sm.quantity}
                                  onChange={(e) => {
                                    const newMods = [...formData.selectedModels]
                                    newMods[idx].quantity = parseInt(e.target.value) || 1
                                    setFormData({ ...formData, selectedModels: newMods })
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => setFormData({ ...formData, selectedModels: formData.selectedModels.filter((_, i) => i !== idx) })}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <Button type="submit" className="w-full h-10 font-bold" disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingBag className="h-4 w-4 mr-2" />}
                      {t("common.save")}
                    </Button>
                  </form>
                </CardContent>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Inventory Table */}
        <div className="xl:col-span-3">
          <Card className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg h-full transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    {t("products.inventory")}
                  </CardTitle>
                  <CardDescription>
                    {t("products.inventory_desc")}
                  </CardDescription>
                </div>
                <div className="bg-muted/30 px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground flex items-center gap-2 border border-muted/20">
                   {t("filament.total")}: {products.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0 border-t border-muted/20">
               {loading ? (
                 <div className="flex h-64 items-center justify-center">
                   <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
                 </div>
               ) : (
                 <Table>
                   <TableHeader className="bg-muted/10">
                     <TableRow>
                       <TableHead className="px-6">{t("products.table.name")}</TableHead>
                       <TableHead className="text-center">{t("products.table.price")}</TableHead>
                       <TableHead className="text-center">{t("products.table.stock")}</TableHead>
                       <TableHead className="px-6 text-right"></TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {products.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={4} className="h-48 text-center text-muted-foreground opacity-50">
                           <Search className="h-12 w-12 mx-auto mb-2" />
                           <p>{t("common.no_data")}</p>
                         </TableCell>
                       </TableRow>
                     ) : (
                       products.map((p) => (
                         <TableRow key={p.ID} className="hover:bg-muted/5 transition-colors border-muted/10 h-20">
                           <TableCell className="px-6">
                              <div className="flex items-center gap-3">
                                <div className="flex -space-x-4">
                                  {p.ImageFront ? (
                                    <img src={`http://localhost:3001/${p.ImageFront}`} alt={p.Name} className="w-12 h-12 rounded-lg object-cover border-2 border-background shadow-md" />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-muted/20 flex items-center justify-center border-2 border-background text-muted-foreground shadow-md">
                                      <ImageIcon className="h-5 w-5" />
                                    </div>
                                  )}
                                  {p.ImageBack && (
                                    <img src={`http://localhost:3001/${p.ImageBack}`} alt={p.Name} className="w-12 h-12 rounded-lg object-cover border-2 border-background shadow-md" />
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm">{p.Name}</span>
                                  <div className="flex gap-1 items-center mt-1">
                                    {p.materials?.length > 0 && <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded-full border border-primary/20">{p.materials.length} {t("nav.materials")}</span>}
                                    {p.models?.length > 0 && <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 rounded-full border border-blue-500/20">{p.models.length} {t("nav.models")}</span>}
                                  </div>
                                </div>
                              </div>
                           </TableCell>
                           <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-black text-lg">{p.Price}₺</span>
                                {p.ProfitMultiplier && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><TrendingUp className="h-2 w-2" /> x{p.ProfitMultiplier}</span>}
                              </div>
                           </TableCell>
                           <TableCell className="text-center font-semibold">{p.Stock}</TableCell>
                           <TableCell className="px-6 text-right">
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/20">
                                   <MoreVertical className="h-4 w-4" />
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="w-40">
                                 <DropdownMenuItem onClick={() => handleEditClick(p)} className="cursor-pointer">
                                   <Edit3 className="mr-2 h-4 w-4" />
                                   {t("common.edit")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => handleDeleteProduct(p.ID)} className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer">
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-muted/30 max-h-[90vh] overflow-y-auto scrollbar-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              {t("common.edit")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{t("products.name")}</Label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className={cn(isFieldChanged("name", editFormData.name) && "border-yellow-400 ring-1 ring-yellow-400/50")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{t("products.profit_multiplier")}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editFormData.profitMultiplier}
                  onChange={(e) => setEditFormData({ ...editFormData, profitMultiplier: e.target.value })}
                  className={cn(isFieldChanged("profitMultiplier", editFormData.profitMultiplier) && "border-yellow-400 ring-1 ring-yellow-400/50")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t("products.description")}</Label>
              <Input
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className={cn(isFieldChanged("description", editFormData.description) && "border-yellow-400 ring-1 ring-yellow-400/50")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{t("products.price")}</Label>
                <Input
                  type="number"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                  required
                  className={cn("text-left", isFieldChanged("price", editFormData.price) && "border-yellow-400 ring-1 ring-yellow-400/50")}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{t("products.stock")}</Label>
                <Input
                  type="number"
                  value={editFormData.stock}
                  onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })}
                  required
                  className={cn("text-left", isFieldChanged("stock", editFormData.stock) && "border-yellow-400 ring-1 ring-yellow-400/50")}
                />
              </div>
            </div>

            {/* Sub-product toggle in Edit */}
            <div className="flex gap-4 p-2 bg-muted/20 rounded-lg border border-muted/10">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="edit-type-main"
                  name="edit-product-type"
                  checked={!editFormData.parentId}
                  onChange={() => setEditFormData({ ...editFormData, parentId: "" })}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
                <Label htmlFor="edit-type-main" className="text-xs font-bold cursor-pointer">{t("products.inventory")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="edit-type-sub"
                  name="edit-product-type"
                  checked={!!editFormData.parentId}
                  onChange={() => setEditFormData({ ...editFormData, parentId: products.find(p => p.ID !== selectedProduct?.ID)?.ID.toString() || "" })}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
                <Label htmlFor="edit-type-sub" className="text-xs font-bold cursor-pointer">{t("products.sub_product")}</Label>
              </div>
            </div>

            {editFormData.parentId && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.parent_product")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-10 bg-background/40 border-muted/30 text-xs">
                      {products.find(p => p.ID.toString() === editFormData.parentId)?.Name || t("common.select")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t("common.search")} />
                      <CommandList>
                        <CommandEmpty>{t("common.no_data")}</CommandEmpty>
                        <CommandGroup>
                          {products.filter(p => !p.ParentID && p.ID !== selectedProduct?.ID).map((p) => (
                            <CommandItem
                              key={p.ID}
                              onSelect={() => setEditFormData({ ...editFormData, parentId: p.ID.toString() })}
                            >
                              <Check className={cn("mr-2 h-4 w-4", editFormData.parentId === p.ID.toString() ? "opacity-100" : "opacity-0")} />
                              {p.Name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.name")}</Label>
              <Input
                placeholder={t("products.name")}
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
                className={cn("bg-background/40", isFieldChanged("name", editFormData.name) && "border-yellow-400 ring-1 ring-yellow-400/50")}
              />
            </div>

            {!editFormData.parentId && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.description")}</Label>
                  <Input
                    placeholder={t("products.description")}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className={cn("bg-background/40", isFieldChanged("description", editFormData.description) && "border-yellow-400 ring-1 ring-yellow-400/50")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.profit_multiplier")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editFormData.profitMultiplier}
                    onChange={(e) => setEditFormData({ ...editFormData, profitMultiplier: e.target.value })}
                    className={cn("bg-background/40", isFieldChanged("profitMultiplier", editFormData.profitMultiplier) && "border-yellow-400 ring-1 ring-yellow-400/50")}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("common.category")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-between h-10 bg-background/40 border-muted/30 text-xs", isFieldChanged("categoryId", editFormData.categoryId) && "border-yellow-400 ring-1 ring-yellow-400/50")}>
                    {categories.find(c => c.ID.toString() === editFormData.categoryId)?.Name || t("common.select")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t("common.search")} />
                    <CommandList>
                      <CommandEmpty>{t("common.no_data")}</CommandEmpty>
                      <CommandGroup>
                        {categories.map((cat) => (
                          <CommandItem
                            key={cat.ID}
                            onSelect={() => setEditFormData({ ...editFormData, categoryId: cat.ID.toString() })}
                          >
                            <Check className={cn("mr-2 h-4 w-4", editFormData.categoryId === cat.ID.toString() ? "opacity-100" : "opacity-0")} />
                            {cat.Name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.image_front")}</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditFormData({ ...editFormData, imageFront: e.target.files?.[0] || null })}
                  className="bg-background/40 border-muted/30 h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.image_back")}</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditFormData({ ...editFormData, imageBack: e.target.files?.[0] || null })}
                  className="bg-background/40 border-muted/30 h-10"
                />
              </div>
            </div>

            {!editFormData.parentId && (
              <div className="space-y-4">
                {/* Filament Selection in Edit */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-muted/10">
                  <Label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Box className="h-3 w-3 text-primary" />
                    {t("products.select_filaments")}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9 text-xs">
                        {t("products.add_filament")}
                        <Plus className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder={t("common.search")} />
                        <CommandList>
                          <CommandEmpty>{t("common.no_data")}</CommandEmpty>
                          <CommandGroup>
                            {filaments.map(f => (
                              <CommandItem
                                key={f.ID}
                                onSelect={() => {
                                  setEditFormData(prev => ({
                                    ...prev,
                                    selectedFilaments: [...prev.selectedFilaments, { id: f.ID, quantity: 100 }]
                                  }))
                                }}
                              >
                                {f.Name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="space-y-2">
                    {editFormData.selectedFilaments.map((sf, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-background/60 p-2 rounded-lg border border-muted/10">
                        <span className="text-xs font-medium flex-1 truncate">
                          {filaments.find(f => f.ID === sf.id)?.Name}
                        </span>
                        <div className="flex items-center gap-1">
                          <Input 
                            type="number" 
                            className="w-16 h-7 text-xs px-1 text-left" 
                            value={sf.quantity}
                            onChange={(e) => {
                              const newFils = [...editFormData.selectedFilaments]
                              newFils[idx].quantity = parseInt(e.target.value) || 1
                              setEditFormData({ ...editFormData, selectedFilaments: newFils })
                            }}
                          />
                          <span className="text-[10px] text-muted-foreground">gr</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => setEditFormData({ ...editFormData, selectedFilaments: editFormData.selectedFilaments.filter((_, i) => i !== idx) })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Material Selection in Edit */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-muted/10">
                  <Label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Layers className="h-3 w-3 text-primary" />
                    {t("products.select_materials")}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9 text-xs">
                        {t("products.add_material")}
                        <Plus className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder={t("common.search")} />
                        <CommandList>
                          <CommandEmpty>{t("common.no_data")}</CommandEmpty>
                          <CommandGroup>
                            {materials.map(m => (
                              <CommandItem
                                key={m.ID}
                                onSelect={() => {
                                  setEditFormData(prev => ({
                                    ...prev,
                                    selectedMaterials: [...prev.selectedMaterials, { id: m.ID, quantity: 1 }]
                                  }))
                                }}
                              >
                                {m.Name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="space-y-2">
                    {editFormData.selectedMaterials.map((sm, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-background/60 p-2 rounded-lg border border-muted/10">
                        <span className="text-xs font-medium flex-1 truncate">
                          {materials.find(m => m.ID === sm.id)?.Name}
                        </span>
                        <Input 
                          type="number" 
                          className="w-16 h-7 text-xs px-1 text-left" 
                          value={sm.quantity}
                          onChange={(e) => {
                            const newMats = [...editFormData.selectedMaterials]
                            newMats[idx].quantity = parseInt(e.target.value) || 1
                            setEditFormData({ ...editFormData, selectedMaterials: newMats })
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => setEditFormData({ ...editFormData, selectedMaterials: editFormData.selectedMaterials.filter((_, i) => i !== idx) })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model Selection in Edit */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-muted/10">
                  <Label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    {t("products.select_models")}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9 text-xs">
                        {t("products.add_model")}
                        <Plus className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder={t("common.search")} />
                        <CommandList>
                          <CommandEmpty>{t("common.no_data")}</CommandEmpty>
                          <CommandGroup>
                            {models.map(m => (
                              <CommandItem
                                key={m.ID}
                                onSelect={() => {
                                  setEditFormData(prev => ({
                                    ...prev,
                                    selectedModels: [...prev.selectedModels, { id: m.ID, quantity: 1 }]
                                  }))
                                }}
                              >
                                {m.Name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="space-y-2">
                    {editFormData.selectedModels.map((sm, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-background/60 p-2 rounded-lg border border-muted/10">
                        <span className="text-xs font-medium flex-1 truncate">
                          {models.find(m => m.ID === sm.id)?.Name}
                        </span>
                        <Input 
                          type="number" 
                          className="w-16 h-7 text-xs px-1 text-left" 
                          value={sm.quantity}
                          onChange={(e) => {
                            const newMods = [...editFormData.selectedModels]
                            newMods[idx].quantity = parseInt(e.target.value) || 1
                            setEditFormData({ ...editFormData, selectedModels: newMods })
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => setEditFormData({ ...editFormData, selectedModels: editFormData.selectedModels.filter((_, i) => i !== idx) })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={updating}>
                {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
