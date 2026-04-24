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
  Tag,
  ExternalLink,
  Info
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
import { Checkbox } from "@/ui/controls/checkbox"
import { toast } from "sonner"
import { CategoryCard } from "@/ui/admin/CategoryCard"

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
  ParentName?: string
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
  const [addingCategory, setAddingCategory] = React.useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = React.useState<number | null>(null)
  const [openParentSelect, setOpenParentSelect] = React.useState(false)
  const [openCategorySelect, setOpenCategorySelect] = React.useState(false)
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
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
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
    if (formData.imageBack) body.append("imageBack", formData.imageBack)
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    const body = new FormData()
    body.append("name", editFormData.name)
    body.append("description", editFormData.description)
    body.append("price", editFormData.price)
    body.append("stock", editFormData.stock)
    body.append("profitMultiplier", editFormData.profitMultiplier)
    if (editFormData.imageFront) body.append("imageFront", editFormData.imageFront)
    if (editFormData.imageBack) body.append("imageBack", editFormData.imageBack)
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

  const filamentTotalPercentage = formData.selectedFilaments.reduce((acc, f) => acc + f.quantity, 0)
  const isFilamentTotalValid = filamentTotalPercentage === 100

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {t("nav.products")}
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300">
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
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex items-center space-x-2 p-2 bg-muted/20 rounded-lg border border-muted/10">
                      <Checkbox 
                        id="subproduct" 
                        checked={isSubProduct} 
                        onCheckedChange={(checked) => setIsSubProduct(checked as boolean)}
                      />
                      <Label htmlFor="subproduct" className="text-xs font-bold cursor-pointer">{t("products.sub_product")}</Label>
                    </div>

                    {isSubProduct ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("products.parent_product")}</Label>
                          <Popover open={openParentSelect} onOpenChange={setOpenParentSelect}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between h-10 text-xs">
                                {formData.parentId ? products.find(p => p.ID.toString() === formData.parentId)?.Name : t("common.select")}
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[250px] p-0" align="start">
                              <div className="flex items-center justify-between p-2 border-b border-muted/20 bg-muted/5">
                                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">{t("products.parent_product")}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 p-0 text-primary hover:bg-primary/10"
                                  onClick={() => {
                                    setOpenParentSelect(false)
                                    setIsSubProduct(false)
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <Command>
                                <CommandInput placeholder={t("common.search")} />
                                <CommandList>
                                  <CommandEmpty>{t("common.no_data")}</CommandEmpty>
                                  <CommandGroup>
                                    {products.filter(p => !p.ParentID).map(p => (
                                      <CommandItem key={p.ID} onSelect={() => { setFormData({...formData, parentId: p.ID.toString()}); setOpenParentSelect(false); }}>
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
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("products.name")}</Label>
                          <Input 
                            placeholder={t("products.name_placeholder") || "Örn: Gümüş"} 
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("products.image_front")}</Label>
                          <Input type="file" onChange={(e) => setFormData({...formData, imageFront: e.target.files?.[0] || null})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("products.image_back")}</Label>
                          <Input type="file" onChange={(e) => setFormData({...formData, imageBack: e.target.files?.[0] || null})} />
                        </div>
                        <div className={cn("space-y-3 p-4 rounded-xl bg-muted/20 border transition-colors", !isFilamentTotalValid ? "border-yellow-500/50" : "border-muted/10")}>
                          <Label className="text-xs font-bold tracking-widest flex items-center justify-between">
                            <span className="flex items-center gap-2"><Box className="h-3 w-3 text-primary" />{t("products.select_filaments")}</span>
                            <span className={cn("text-[10px]", !isFilamentTotalValid ? "text-yellow-500" : "text-muted-foreground")}>{filamentTotalPercentage}%</span>
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between h-9 text-xs">
                                {t("products.add_filament")}<Plus className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                              <div className="flex items-center justify-between p-2 border-b border-muted/20 bg-muted/5">
                                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">{t("nav.filament")}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 p-0 text-primary hover:bg-primary/10"
                                  onClick={() => window.location.href = '/admin/filament'}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <Command>
                                <CommandInput placeholder={t("common.search")} />
                                <CommandList>
                                  <CommandGroup>
                                    {filaments.map(f => (
                                      <CommandItem key={f.ID} onSelect={() => setFormData({...formData, selectedFilaments: [...formData.selectedFilaments, {id: f.ID, quantity: formData.selectedFilaments.length === 0 ? 100 : 0}]})}>
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
                                <span className="text-xs font-medium flex-1 truncate">{filaments.find(f => f.ID === sf.id)?.Name}</span>
                                <Input type="number" className="w-16 h-7 text-xs px-1" value={sf.quantity} onChange={(e) => {
                                  const newFils = [...formData.selectedFilaments];
                                  newFils[idx].quantity = parseInt(e.target.value) || 0;
                                  setFormData({...formData, selectedFilaments: newFils});
                                }} />
                                <span className="text-[10px] text-muted-foreground">%</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setFormData({...formData, selectedFilaments: formData.selectedFilaments.filter((_, i) => i !== idx)})}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("products.name")}</Label>
                          <Input 
                            placeholder={t("products.name_placeholder") || "Örn: Minecraft Kılıç"} 
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("products.description")}</Label>
                          <Input 
                            placeholder={t("products.description") || "Ürün açıklaması..."} 
                            value={formData.description} 
                            onChange={(e) => setFormData({...formData, description: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("products.profit_multiplier")}</Label>
                          <Input 
                            type="number" 
                            step="0.1" 
                            placeholder="1.5" 
                            value={formData.profitMultiplier} 
                            onChange={(e) => setFormData({...formData, profitMultiplier: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{t("common.category")}</Label>
                          <Popover open={openCategorySelect} onOpenChange={setOpenCategorySelect}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between h-10 text-xs">
                                {categories.find(c => c.ID.toString() === formData.categoryId)?.Name || t("common.select")}
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                              <div className="flex items-center justify-between p-2 border-b border-muted/20 bg-muted/5">
                                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">{t("common.category")}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 p-0 text-primary hover:bg-primary/10"
                                  onClick={() => {
                                    setOpenCategorySelect(false)
                                    document.getElementById('category-management')?.scrollIntoView({ behavior: 'smooth' })
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <Command>
                                <CommandInput placeholder={t("common.search")} />
                                <CommandList>
                                  <CommandGroup>
                                    {categories.map(c => (
                                      <CommandItem key={c.ID} onSelect={() => { setFormData({...formData, categoryId: c.ID.toString()}); setOpenCategorySelect(false); }}>
                                        <Check className={cn("mr-2 h-4 w-4", formData.categoryId === c.ID.toString() ? "opacity-100" : "opacity-0")} />
                                        {c.Name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-muted/10">
                          <Label className="text-xs font-bold tracking-widest flex items-center gap-2"><TrendingUp className="h-3 w-3 text-primary" />{t("products.select_models")}</Label>
                          <Popover>
                            <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between h-9 text-xs">{t("products.add_model")}<Plus className="h-3 w-3" /></Button></PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                              <div className="flex items-center justify-between p-2 border-b border-muted/20 bg-muted/5">
                                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">{t("nav.models")}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 p-0 text-primary hover:bg-primary/10"
                                  onClick={() => window.location.href = '/admin/models'}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <Command><CommandInput placeholder={t("common.search")} /><CommandList><CommandGroup>{models.map(m => (<CommandItem key={m.ID} onSelect={() => setFormData({...formData, selectedModels: [...formData.selectedModels, {id: m.ID, quantity: 1}]})}>{m.Name}</CommandItem>))}</CommandGroup></CommandList></Command>
                            </PopoverContent>
                          </Popover>
                          <div className="space-y-2">{formData.selectedModels.map((sm, idx) => (<div key={idx} className="flex items-center gap-2 bg-background/60 p-2 rounded-lg border border-muted/10"><span className="text-xs font-medium flex-1 truncate">{models.find(m => m.ID === sm.id)?.Name}</span><Input type="number" className="w-16 h-7 text-xs px-1" value={sm.quantity} onChange={(e) => { const newMods = [...formData.selectedModels]; newMods[idx].quantity = parseInt(e.target.value) || 1; setFormData({...formData, selectedModels: newMods}); }} /><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setFormData({...formData, selectedModels: formData.selectedModels.filter((_, i) => i !== idx)})}><X className="h-3 w-3" /></Button></div>))}</div>
                        </div>
                        <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-muted/10">
                          <Label className="text-xs font-bold tracking-widest flex items-center gap-2"><Layers className="h-3 w-3 text-primary" />{t("products.select_materials")}</Label>
                          <Popover>
                            <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between h-9 text-xs">{t("products.add_material")}<Plus className="h-3 w-3" /></Button></PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                              <div className="flex items-center justify-between p-2 border-b border-muted/20 bg-muted/5">
                                <span className="text-[10px] font-bold tracking-wider text-muted-foreground">{t("nav.materials")}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 p-0 text-primary hover:bg-primary/10"
                                  onClick={() => window.location.href = '/admin/materials'}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <Command><CommandInput placeholder={t("common.search")} /><CommandList><CommandGroup>{materials.map(m => (<CommandItem key={m.ID} onSelect={() => setFormData({...formData, selectedMaterials: [...formData.selectedMaterials, {id: m.ID, quantity: 1}]})}>{m.Name}</CommandItem>))}</CommandGroup></CommandList></Command>
                            </PopoverContent>
                          </Popover>
                          <div className="space-y-2">{formData.selectedMaterials.map((sm, idx) => (<div key={idx} className="flex items-center gap-2 bg-background/60 p-2 rounded-lg border border-muted/10"><span className="text-xs font-medium flex-1 truncate">{materials.find(m => m.ID === sm.id)?.Name}</span><Input type="number" className="w-16 h-7 text-xs px-1" value={sm.quantity} onChange={(e) => { const newMats = [...formData.selectedMaterials]; newMats[idx].quantity = parseInt(e.target.value) || 1; setFormData({...formData, selectedMaterials: newMats}); }} /><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setFormData({...formData, selectedMaterials: formData.selectedMaterials.filter((_, i) => i !== idx)})}><X className="h-3 w-3" /></Button></div>))}</div>
                        </div>
                      </div>
                    )}

                    <Button type="submit" className="w-full h-10 font-bold bg-primary hover:bg-primary/90 shadow-lg" disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingBag className="h-4 w-4 mr-2" />}
                      {t("common.save")}
                    </Button>
                  </form>
                </CardContent>
              </div>
            </div>
          </Card>

          <CategoryCard
            title={t("common.add_category")}
            description={t("products.categories_desc")}
            categories={categories}
            onAdd={async (name) => {
              setAddingCategory(true)
              try {
                const response = await fetch("http://localhost:3001/api/product-categories", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name }),
                })
                if (response.ok) fetchData()
              } finally {
                setAddingCategory(false)
              }
            }}
            onDelete={handleDeleteCategory}
            addingCategory={addingCategory}
            deletingCategoryId={deletingCategoryId}
          />
        </div>

        <div className="lg:col-span-8">
          <Card className="h-full border-muted/40 bg-card/40 backdrop-blur-md shadow-lg flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{t("products.inventory")}</CardTitle>
                </div>
                <div className="bg-muted/30 px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground border border-muted/20">
                  {t("filament.total")}: {products.filter(p => p.ParentID).length}
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
                      <TableHead className="text-center">{t("common.category")}</TableHead>
                      <TableHead className="text-center">{t("products.profit_multiplier")}</TableHead>
                      <TableHead className="text-center">{t("common.cost")}</TableHead>
                      <TableHead className="text-center">{t("products.table.price")}</TableHead>
                      <TableHead className="px-6 text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.filter(p => p.ParentID).map((p) => (
                      <TableRow key={p.ID} className="hover:bg-muted/5 transition-colors border-muted/10 h-16">
                        <TableCell className="px-6 font-medium">
                          {p.Name} <span className="text-muted-foreground/60 text-xs font-normal">({p.ParentName})</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 rounded-full bg-muted/20 text-[11px]">
                            {p.CategoryName || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{p.ProfitMultiplier}x</TableCell>
                        <TableCell className="text-center font-bold">0.00</TableCell>
                        <TableCell className="text-center font-bold">{p.Price}</TableCell>
                        <TableCell className="px-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/20">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => { setSelectedProduct(p); setIsDetailOpen(true); }}><Eye className="mr-2 h-4 w-4" />{t("common.details")}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditClick(p)}><Edit3 className="mr-2 h-4 w-4" />{t("common.edit")}</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteProduct(p.ID)}><Trash2 className="mr-2 h-4 w-4" />{t("common.delete")}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-muted/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
              {selectedProduct?.Name}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct?.ParentName ? `Üst Ürün: ${selectedProduct.ParentName}` : "Ana Ürün"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-muted/30">
              <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{t("common.category")}</p>
                <p className="text-sm font-semibold">{selectedProduct?.CategoryName || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{t("products.profit_multiplier")}</p>
                <p className="text-sm font-semibold">{selectedProduct?.ProfitMultiplier}x</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{t("common.cost")}</p>
                <p className="text-sm font-semibold">0.00</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{t("products.table.price")}</p>
                <p className="text-sm font-bold text-primary">{selectedProduct?.Price}</p>
              </div>
            </div>

            {selectedProduct?.Description && (
              <div className="space-y-1 p-4 bg-muted/10 rounded-xl border border-muted/20">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{t("products.description")}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedProduct.Description}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-muted/10 rounded-xl border border-muted/20 text-center">
                <Layers className="h-4 w-4 mx-auto mb-1 text-primary/60" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{t("nav.materials")}</p>
                <p className="text-xs font-bold">{selectedProduct?.materials?.length || 0}</p>
              </div>
              <div className="p-3 bg-muted/10 rounded-xl border border-muted/20 text-center">
                <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary/60" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{t("nav.models")}</p>
                <p className="text-xs font-bold">{selectedProduct?.models?.length || 0}</p>
              </div>
              <div className="p-3 bg-muted/10 rounded-xl border border-muted/20 text-center">
                <Box className="h-4 w-4 mx-auto mb-1 text-primary/60" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{t("nav.filament")}</p>
                <p className="text-xs font-bold">{selectedProduct?.filaments?.length || 0}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
