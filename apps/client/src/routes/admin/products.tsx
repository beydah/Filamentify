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
  ChevronsUpDown
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

interface Product {
  ID: number
  Name: string
  Description: string
  Price: number
  Stock: number
  ImageFront: string
  ImageBack: string
  ProfitMultiplier: number
  materials: ProductDetail[]
  models: ProductDetail[]
}

const toTitleCase = (str: string) => {
  return str.split(' ').map(w => w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1).toLocaleLowerCase('tr-TR')).join(' ');
}

export default function ProductsPage() {
  const { t } = useTranslation()
  const [isFormOpen, setIsFormOpen] = React.useState(true)
  const [products, setProducts] = React.useState<Product[]>([])
  const [materials, setMaterials] = React.useState<Material[]>([])
  const [models, setModels] = React.useState<Model[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)

  // Form State
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    price: "0",
    stock: "0",
    profitMultiplier: "1.0",
    imageFront: null as File | null,
    imageBack: null as File | null,
    selectedMaterials: [] as { id: number, quantity: number }[],
    selectedModels: [] as { id: number, quantity: number }[]
  })

  // Edit State
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
  const [editFormData, setEditFormData] = React.useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    profitMultiplier: "1.0",
    imageFront: null as File | null,
    imageBack: null as File | null,
    selectedMaterials: [] as { id: number, quantity: number }[],
    selectedModels: [] as { id: number, quantity: number }[]
  })
  const [updating, setUpdating] = React.useState(false)

  // Fetch Data
  const fetchData = React.useCallback(async () => {
    try {
      const [prodRes, matRes, modRes] = await Promise.all([
        fetch("http://localhost:3001/api/products"),
        fetch("http://localhost:3001/api/materials"),
        fetch("http://localhost:3001/api/models")
      ])
      const [prodData, matData, modData] = await Promise.all([
        prodRes.json(),
        matRes.json(),
        modRes.json()
      ])
      setProducts(prodData)
      setMaterials(matData)
      setModels(modData)
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
    body.append("name", toTitleCase(formData.name))
    body.append("description", formData.description)
    body.append("price", formData.price)
    body.append("stock", formData.stock)
    body.append("profitMultiplier", formData.profitMultiplier)
    if (formData.imageFront) body.append("imageFront", formData.imageFront)
    if (formData.imageBack) body.append("imageBack", formData.imageBack)
    body.append("materials", JSON.stringify(formData.selectedMaterials))
    body.append("models", JSON.stringify(formData.selectedModels))

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
          profitMultiplier: "1.0",
          imageFront: null,
          imageBack: null,
          selectedMaterials: [],
          selectedModels: []
        })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to add product:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    setUpdating(true)

    const body = new FormData()
    body.append("name", toTitleCase(editFormData.name))
    body.append("description", editFormData.description)
    body.append("price", editFormData.price)
    body.append("stock", editFormData.stock)
    body.append("profitMultiplier", editFormData.profitMultiplier)
    if (editFormData.imageFront) body.append("imageFront", editFormData.imageFront)
    if (editFormData.imageBack) body.append("imageBack", editFormData.imageBack)
    body.append("materials", JSON.stringify(editFormData.selectedMaterials))
    body.append("models", JSON.stringify(editFormData.selectedModels))

    try {
      const response = await fetch(`http://localhost:3001/api/products/${selectedProduct.ID}`, {
        method: "PATCH",
        body
      })
      if (response.ok) {
        toast.success(t("common.notifications.updated"))
        setIsEditOpen(false)
        fetchData()
      }
    } catch (error) {
      console.error("Failed to update product:", error)
    } finally {
      setUpdating(false)
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
    setEditFormData({
      name: p.Name,
      description: p.Description || "",
      price: p.Price.toString(),
      stock: p.Stock.toString(),
      profitMultiplier: p.ProfitMultiplier?.toString() || "1.0",
      imageFront: null,
      imageBack: null,
      selectedMaterials: p.materials?.map(m => ({ id: m.ID, quantity: m.Quantity })) || [],
      selectedModels: p.models?.map(m => ({ id: m.ID, quantity: m.Quantity })) || []
    })
    setIsEditOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {t("nav.products")}
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Form */}
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
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
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
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.description")}</Label>
                      <Input
                        placeholder={t("products.description")}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="bg-background/40 border-muted/30 h-10"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.price")}</Label>
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                          className="bg-background/40 border-muted/30 h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.stock")}</Label>
                        <Input
                          type="number"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                          required
                          className="bg-background/40 border-muted/30 h-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                              className="w-16 h-7 text-xs px-1" 
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
                              className="h-7 w-7 text-red-500"
                              onClick={() => {
                                const newMats = formData.selectedMaterials.filter((_, i) => i !== idx)
                                setFormData({ ...formData, selectedMaterials: newMats })
                              }}
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
                        <Box className="h-3 w-3 text-primary" />
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
                              className="w-16 h-7 text-xs px-1" 
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
                              className="h-7 w-7 text-red-500"
                              onClick={() => {
                                const newMods = formData.selectedModels.filter((_, i) => i !== idx)
                                setFormData({ ...formData, selectedModels: newMods })
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
                      disabled={submitting}
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      {t("products.new_record")}
                    </Button>
                  </form>
                </CardContent>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: List (Table) */}
        <div className="lg:col-span-8">
          <Card className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg h-full flex flex-col overflow-hidden transition-all duration-300">
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t("products.description")}</Label>
              <Input
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
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
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{t("products.stock")}</Label>
                <Input
                  type="number"
                  value={editFormData.stock}
                  onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{t("products.image_front")}</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditFormData({ ...editFormData, imageFront: e.target.files?.[0] || null })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{t("products.image_back")}</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditFormData({ ...editFormData, imageBack: e.target.files?.[0] || null })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  <PopoverContent className="w-[200px] p-0">
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
                
                <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-none">
                  {editFormData.selectedMaterials.map((sm, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-background/60 p-2 rounded-lg border border-muted/10">
                      <span className="text-[10px] font-medium flex-1 truncate">
                        {materials.find(m => m.ID === sm.id)?.Name}
                      </span>
                      <Input 
                        type="number" 
                        className="w-12 h-6 text-[10px] px-1" 
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
                        className="h-6 w-6 text-red-500"
                        onClick={() => {
                          const newMats = editFormData.selectedMaterials.filter((_, i) => i !== idx)
                          setEditFormData({ ...editFormData, selectedMaterials: newMats })
                        }}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Selection in Edit */}
              <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-muted/10">
                <Label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Box className="h-3 w-3 text-primary" />
                  {t("products.select_models")}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-9 text-xs">
                      {t("products.add_model")}
                      <Plus className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
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
                
                <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-none">
                  {editFormData.selectedModels.map((sm, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-background/60 p-2 rounded-lg border border-muted/10">
                      <span className="text-[10px] font-medium flex-1 truncate">
                        {models.find(m => m.ID === sm.id)?.Name}
                      </span>
                      <Input 
                        type="number" 
                        className="w-12 h-6 text-[10px] px-1" 
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
                        className="h-6 w-6 text-red-500"
                        onClick={() => {
                          const newMods = editFormData.selectedModels.filter((_, i) => i !== idx)
                          setEditFormData({ ...editFormData, selectedModels: newMods })
                        }}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

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
