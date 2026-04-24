import * as React from "react"
import { useTranslation } from "react-i18next"
import { 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Tag,
  Loader2,
  Trash2,
  Check,
  ChevronsUpDown,
  ExternalLink,
  MoreVertical,
  Box,
  Eye,
  Edit3,
  AlertCircle,
  Layers,
  Minus
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/controls/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/ui/controls/command"
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
import { Calendar } from "@/ui/controls/calendar"
import { subMonths } from "date-fns"
import { toast } from "sonner"

interface MaterialCategory {
  ID: number
  Name: string
}

interface Material {
  ID: number
  CategoryID: number
  Name: string
  Quantity: number
  TotalPrice: number
  Link: string
  CategoryName: string
  PurchaseDate: string
}

const toTitleCase = (str: string) => {
  return str;
}

export default function MaterialsPage() {
  const { t } = useTranslation()
  const [isFormOpen, setIsFormOpen] = React.useState(true)
  const [isCatOpen, setIsCatOpen] = React.useState(true)
  const [openCategory, setOpenCategory] = React.useState(false)
  const [materials, setMaterials] = React.useState<Material[]>([])
  const [categories, setCategories] = React.useState<MaterialCategory[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [addingCategory, setAddingCategory] = React.useState(false)
  const [newCategory, setNewCategory] = React.useState("")
  const [deletingCategoryId, setDeletingCategoryId] = React.useState<number | null>(null)

  const [formData, setFormData] = React.useState({
    name: "",
    categoryId: "",
    quantity: "100",
    totalPrice: "100",
    link: "",
    purchaseDate: new Date()
  })

  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [selectedMaterial, setSelectedMaterial] = React.useState<Material | null>(null)
  const [originalMaterial, setOriginalMaterial] = React.useState<Material | null>(null)
  const [editFormData, setEditFormData] = React.useState({
    name: "",
    categoryId: "",
    quantity: "",
    totalPrice: "",
    link: "",
    purchaseDate: new Date()
  })
  const [updating, setUpdating] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    try {
      const [matRes, catRes] = await Promise.all([
        fetch("http://localhost:3001/api/materials"),
        fetch("http://localhost:3001/api/material-categories")
      ])
      const matData = await matRes.json()
      const catData = await catRes.json()
      setMaterials(matData)
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    setAddingCategory(true)
    try {
      const response = await fetch("http://localhost:3001/api/material-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: toTitleCase(newCategory) })
      })
      if (response.ok) {
        setNewCategory("")
        fetchData()
        toast.success(t("common.notifications.added"))
      }
    } catch (error) {
      console.error("Failed to add category:", error)
    } finally {
      setAddingCategory(false)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    setDeletingCategoryId(id)
    try {
      const response = await fetch(`http://localhost:3001/api/material-categories/${id}`, {
        method: "DELETE"
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
      console.error("Failed to delete category:", error)
    } finally {
      setDeletingCategoryId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.categoryId) return
    setSubmitting(true)
    try {
      const response = await fetch("http://localhost:3001/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          name: toTitleCase(formData.name),
          purchaseDate: formData.purchaseDate.toISOString()
        })
      })
      if (response.ok) {
        toast.success(t("common.notifications.added"))
        setFormData({
          name: "",
          categoryId: "",
          quantity: "100",
          totalPrice: "100",
          link: "",
          purchaseDate: new Date()
        })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to add material:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMaterial = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/materials/${id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        toast.success(t("common.notifications.deleted"))
        fetchData()
      }
    } catch (error) {
      console.error("Failed to delete material:", error)
    }
  }

  const handleEditClick = (m: Material) => {
    setSelectedMaterial(m)
    setOriginalMaterial(m)
    setEditFormData({
      name: m.Name,
      categoryId: m.CategoryID.toString(),
      quantity: m.Quantity.toString(),
      totalPrice: m.TotalPrice.toString(),
      link: m.Link || "",
      purchaseDate: m.PurchaseDate ? new Date(m.PurchaseDate) : new Date()
    })
    setIsEditOpen(true)
  }

  const isFieldChanged = (field: string, value: any) => {
    if (!originalMaterial) return false
    switch (field) {
      case "name": return value !== originalMaterial.Name
      case "categoryId": return value !== originalMaterial.CategoryID.toString()
      case "quantity": return value !== originalMaterial.Quantity.toString()
      case "totalPrice": return value !== originalMaterial.TotalPrice.toString()
      case "link": return value !== (originalMaterial.Link || "")
      case "purchaseDate": return value.toDateString() !== new Date(originalMaterial.PurchaseDate).toDateString()
      default: return false
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMaterial) return
    setUpdating(true)
    try {
      const response = await fetch(`http://localhost:3001/api/materials/${selectedMaterial.ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editFormData,
          categoryId: editFormData.categoryId ? parseInt(editFormData.categoryId) : null,
          name: toTitleCase(editFormData.name),
          purchaseDate: editFormData.purchaseDate.toISOString()
        })
      })
      if (response.ok) {
        toast.success(t("common.notifications.updated"))
        setIsEditOpen(false)
        fetchData()
      }
    } catch (error) {
      console.error("Failed to update material:", error)
    } finally {
      setUpdating(false)
    }
  }

  const isFormValid = formData.name && formData.categoryId

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {t("nav.materials")}
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  {t("materials.save")}
                </CardTitle>
                <CardDescription>
                  {t("materials.new_record_desc")}
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
                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("materials.name")}</Label>
                      <Input
                        placeholder={t("materials.name_placeholder")}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-background/40 border-muted/30 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("common.category")}</Label>
                      <Popover open={openCategory} onOpenChange={setOpenCategory}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCategory}
                            className="w-full justify-between bg-background/40 border-muted/30 h-10 font-normal px-3"
                          >
                            <span className="truncate">
                                {formData.categoryId
                                  ? categories.find((cat) => cat.ID.toString() === formData.categoryId)?.Name
                                  : t("common.select_category")}
                            </span>
                            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                          <div className="flex items-center justify-between p-2 border-b border-muted/20 bg-muted/5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("common.category")}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 p-0 text-primary hover:bg-primary/10"
                              onClick={() => {
                                setOpenCategory(false)
                                document.getElementById('category-management')?.scrollIntoView({ behavior: 'smooth' })
                              }}
                                title={t("common.add_category")}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Command>
                            <CommandInput placeholder={t("common.search_category")} />
                            <CommandList className="max-h-[200px] overflow-y-auto scrollbar-none">
                              <CommandEmpty>{t("common.category_not_found")}</CommandEmpty>
                              <CommandGroup>
                                {categories.map((cat) => (
                                  <CommandItem
                                    key={cat.ID}
                                    value={cat.Name}
                                    onSelect={() => {
                                      setFormData({ ...formData, categoryId: cat.ID.toString() })
                                      setOpenCategory(false)
                                    }}
                                    className="flex items-center justify-between group cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Check className={cn("h-4 w-4 text-primary", formData.categoryId === cat.ID.toString() ? "opacity-100" : "opacity-0")} />
                                      {cat.Name}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-all"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteCategory(cat.ID)
                                      }}
                                      disabled={deletingCategoryId === cat.ID}
                                    >
                                      {deletingCategoryId === cat.ID ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    </Button>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("materials.quantity")}</Label>
                          <Input
                            type="number"
                            step="50"
                            min="1"
                            max="2500"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            required
                            className="bg-background/40 border-muted/30 text-left"
                          />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("materials.total_price")}</Label>
                          <Input
                            type="number"
                            step="50"
                            min="1"
                            max="5000"
                            value={formData.totalPrice}
                            onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                            required
                            className="bg-background/40 border-muted/30 text-left"
                          />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                        {t("materials.purchase_date")}
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-background/40 border-muted/30 h-10",
                              !formData.purchaseDate && "text-muted-foreground"
                            )}
                          >
                            {formData.purchaseDate ? formData.purchaseDate.toLocaleDateString('tr-TR') : <span>{t("materials.select_date")}</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.purchaseDate}
                            onSelect={(date) => date && setFormData({ ...formData, purchaseDate: date })}
                            disabled={(date) => date > new Date() || date < subMonths(new Date(), 1)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("materials.link")}</Label>
                      <Input
                        placeholder="https://..."
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        className="bg-background/40 border-muted/30 transition-all"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-10 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
                      disabled={!isFormValid || submitting}
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Tag className="h-4 w-4 mr-2" />}
                      {t("materials.save")}
                    </Button>
                  </form>
                </CardContent>
              </div>
            </div>
          </Card>

          <Card id="category-management" className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  {t("common.add_category")}
                </CardTitle>
                <CardDescription>
                  {t("materials.categories_desc")}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsCatOpen(!isCatOpen)}
                className="h-8 w-8 p-0"
              >
                {isCatOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <div className={cn(
              "grid transition-all duration-300 ease-in-out",
              isCatOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}>
              <div className="overflow-hidden">
                <CardContent className="pb-6">
                  <form onSubmit={handleAddCategory} className="flex gap-2">
                    <Input
                      placeholder={t("common.add_category")}
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="bg-background/40 border-muted/30 h-10"
                    />
                    <Button size="icon" type="submit" disabled={addingCategory || !newCategory.trim()}>
                      {addingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </form>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <div key={cat.ID} className="group relative">
                        <span className="px-2.5 py-1 pr-7 rounded-md bg-muted/30 border border-muted/20 text-xs font-medium flex items-center gap-1">
                          {cat.Name}
                        </span>
                        <button
                          onClick={() => handleDeleteCategory(cat.ID)}
                          disabled={deletingCategoryId === cat.ID}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        >
                          {deletingCategoryId === cat.ID ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg h-full flex flex-col overflow-hidden transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Box className="h-5 w-5 text-primary" />
                    {t("materials.inventory")}
                  </CardTitle>
                  <CardDescription>
                    {t("materials.inventory_desc")}
                  </CardDescription>
                </div>
                <div className="bg-muted/30 px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground flex items-center gap-2 border border-muted/20">
                   {t("filament.total")}: {materials.length}
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
                       <TableHead className="px-6">{t("models.table.name")}</TableHead>
                       <TableHead className="text-center">{t("common.category")}</TableHead>
                       <TableHead className="text-center">{t("materials.table.unit_price")}</TableHead>
                       <TableHead className="text-center">{t("materials.table.current")}</TableHead>
                       <TableHead className="text-center">{t("materials.link")}</TableHead>
                       <TableHead className="px-6 text-right"></TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {materials.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={6} className="h-48 text-center text-muted-foreground opacity-50">
                           <Search className="h-12 w-12 mx-auto mb-2" />
                           <p>{t("common.no_data")}</p>
                         </TableCell>
                       </TableRow>
                     ) : (
                       materials.map((m) => (
                         <TableRow key={m.ID} className="hover:bg-muted/5 transition-colors border-muted/10 h-16">
                           <TableCell className="px-6 font-medium">{m.Name}</TableCell>
                           <TableCell className="text-center">
                             <span className="px-2 py-0.5 rounded-full bg-muted/20 text-[11px]">
                                {m.CategoryName}
                             </span>
                           </TableCell>
                           <TableCell className="text-center font-bold">{(m.TotalPrice / m.Quantity).toFixed(2)}</TableCell>
                           <TableCell className="text-center">{m.Quantity} Adet</TableCell>
                           <TableCell className="text-center">
                             {m.Link ? (
                               <a href={m.Link} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                 Link <ExternalLink className="h-3 w-3" />
                               </a>
                             ) : "-"}
                           </TableCell>
                           <TableCell className="px-6 text-right">
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/20">
                                   <MoreVertical className="h-4 w-4" />
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="w-40">
                                 <DropdownMenuItem onClick={() => { setSelectedMaterial(m); setIsDetailOpen(true); }} className="cursor-pointer">
                                   <Eye className="mr-2 h-4 w-4" />
                                   {t("common.details")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => handleEditClick(m)} className="cursor-pointer">
                                   <Edit3 className="mr-2 h-4 w-4" />
                                   {t("common.edit")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => handleDeleteMaterial(m.ID)} className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer">
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
              <Box className="h-6 w-6 text-primary" />
              {selectedMaterial?.Name}
            </DialogTitle>
            <DialogDescription>
              Malzeme detayları ve stok durumu.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-muted/30">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("common.category")}</p>
                <p className="text-sm font-semibold">{selectedMaterial?.CategoryName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("materials.quantity")}</p>
                <p className="text-sm font-semibold">{selectedMaterial?.Quantity} Adet</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("materials.total_price")}</p>
                <p className="text-sm font-semibold">{selectedMaterial?.TotalPrice}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("materials.table.unit_price")}</p>
                <p className="text-sm font-semibold">
                  {selectedMaterial ? (selectedMaterial.TotalPrice / selectedMaterial.Quantity).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>

            <div className="space-y-1 p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <AlertCircle className="h-5 w-5 text-primary" />
                 <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Kayıt Tarihi</p>
                    <p className="text-sm font-medium">{selectedMaterial?.PurchaseDate ? new Date(selectedMaterial.PurchaseDate).toLocaleDateString('tr-TR') : "-"}</p>
                 </div>
               </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between items-center border-t border-muted/20 pt-4">
            <div className="flex items-center gap-2">
              {selectedMaterial?.Link ? (
                <Button variant="outline" size="sm" asChild className="h-8 gap-2 border-primary/30 text-primary hover:bg-primary/5">
                  <a href={selectedMaterial.Link} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Link
                  </a>
                </Button>
              ) : (
                <span className="text-[10px] text-muted-foreground italic px-2">Bağlantı yok</span>
              )}
            </div>
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
              Malzeme bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t("materials.name")}</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
                className={cn(isFieldChanged("name", editFormData.name) && "border-yellow-400 ring-1 ring-yellow-400/50")}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t("common.category")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-between", isFieldChanged("categoryId", editFormData.categoryId) && "border-yellow-400 ring-1 ring-yellow-400/50")}>
                    {categories.find(c => c.ID.toString() === editFormData.categoryId)?.Name || t("common.select")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{t("materials.quantity")}</Label>
                <Input
                  type="number"
                  step="50"
                  min="1"
                  max="2500"
                  value={editFormData.quantity}
                  onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                  required
                  className={cn("bg-background/40 text-left", isFieldChanged("quantity", editFormData.quantity) && "border-yellow-400 ring-1 ring-yellow-400/50")}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{t("materials.total_price")}</Label>
                <Input
                  type="number"
                  step="50"
                  min="1"
                  max="5000"
                  value={editFormData.totalPrice}
                  onChange={(e) => setEditFormData({ ...editFormData, totalPrice: e.target.value })}
                  required
                  className={cn("bg-background/40 text-left", isFieldChanged("totalPrice", editFormData.totalPrice) && "border-yellow-400 ring-1 ring-yellow-400/50")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t("materials.purchase_date")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal h-10">
                    {editFormData.purchaseDate ? editFormData.purchaseDate.toLocaleDateString('tr-TR') : <span>{t("materials.select_date")}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editFormData.purchaseDate}
                    onSelect={(date) => date && setEditFormData({ ...editFormData, purchaseDate: date })}
                    disabled={(date) => date > new Date() || date < subMonths(new Date(), 1)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t("materials.link")}</Label>
              <Input
                value={editFormData.link}
                onChange={(e) => setEditFormData({ ...editFormData, link: e.target.value })}
                className={cn(isFieldChanged("link", editFormData.link) && "border-yellow-400 ring-1 ring-yellow-400/50")}
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
