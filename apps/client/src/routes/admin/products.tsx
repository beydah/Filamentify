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
  Package
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
import { toast } from "sonner"

interface Product {
  ID: number
  Name: string
  Description: string
  Price: number
  Stock: number
  Image: string
  PurchaseDate: string
}

const toTitleCase = (str: string) => {
  return str.split(' ').map(w => w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1).toLocaleLowerCase('tr-TR')).join(' ');
}

export default function ProductsPage() {
  const { t } = useTranslation()
  const [isFormOpen, setIsFormOpen] = React.useState(true)
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    price: "0",
    stock: "0",
    image: ""
  })

  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
  const [editFormData, setEditFormData] = React.useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image: ""
  })
  const [updating, setUpdating] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3001/api/products")
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error("Failed to fetch products:", error)
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
    try {
      const response = await fetch("http://localhost:3001/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          name: toTitleCase(formData.name)
        })
      })
      if (response.ok) {
        toast.success(t("common.notifications.added"))
        setFormData({
          name: "",
          description: "",
          price: "0",
          stock: "0",
          image: ""
        })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to add product:", error)
    } finally {
      setSubmitting(false)
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
      image: p.Image || ""
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    setUpdating(true)
    try {
      const response = await fetch(`http://localhost:3001/api/products/${selectedProduct.ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editFormData,
          name: toTitleCase(editFormData.name)
        })
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
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                          placeholder="0"
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
                          placeholder="0"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                          required
                          className="bg-background/40 border-muted/30 h-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("products.image")}</Label>
                      <Input
                        placeholder="https://..."
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="bg-background/40 border-muted/30 h-10"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-10 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
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
                         <TableRow key={p.ID} className="hover:bg-muted/5 transition-colors border-muted/10 h-16">
                           <TableCell className="px-6">
                              <div className="flex items-center gap-3">
                                {p.Image ? (
                                  <img src={p.Image} alt={p.Name} className="w-10 h-10 rounded-md object-cover border border-muted/20" />
                                ) : (
                                  <div className="w-10 h-10 rounded-md bg-muted/20 flex items-center justify-center border border-muted/20 text-muted-foreground">
                                    <ImageIcon className="h-5 w-5" />
                                  </div>
                                )}
                                <span className="font-medium">{p.Name}</span>
                              </div>
                           </TableCell>
                           <TableCell className="text-center font-bold">{p.Price}</TableCell>
                           <TableCell className="text-center">{p.Stock}</TableCell>
                           <TableCell className="px-6 text-right">
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/20">
                                   <MoreVertical className="h-4 w-4" />
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="w-40">
                                 <DropdownMenuItem onClick={() => { setSelectedProduct(p); setIsDetailOpen(true); }} className="cursor-pointer">
                                   <Eye className="mr-2 h-4 w-4" />
                                   {t("common.details")}
                                 </DropdownMenuItem>
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

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-muted/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
              {selectedProduct?.Name}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct?.Description || "Açıklama bulunmuyor."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
             {selectedProduct?.Image && (
               <img src={selectedProduct.Image} alt={selectedProduct.Name} className="w-full h-48 object-cover rounded-xl border border-muted/30 shadow-md" />
             )}
            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-muted/30">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("products.price")}</p>
                <div className="flex items-center gap-1 text-sm font-semibold">
                  <DollarSign className="h-3 w-3 text-primary" />
                  {selectedProduct?.Price}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("products.stock")}</p>
                <div className="flex items-center gap-1 text-sm font-semibold">
                  <Package className="h-3 w-3 text-primary" />
                  {selectedProduct?.Stock}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)} className="h-8 px-6">{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-muted/30">
          <DialogHeader>
            <DialogTitle>{t("common.edit")}</DialogTitle>
            <DialogDescription>
              Ürün bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t("products.name")}</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
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
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t("products.image")}</Label>
              <Input
                value={editFormData.image}
                onChange={(e) => setEditFormData({ ...editFormData, image: e.target.value })}
              />
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
