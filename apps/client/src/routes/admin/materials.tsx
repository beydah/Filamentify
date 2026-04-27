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
  MoreVertical,
  Box,
  Eye,
  Edit3,
  AlertCircle,
  Filter,
  FilterX
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
import { CategoryCard } from "@/ui/admin/CategoryCard"

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
  UsagePerUnit: number
}

export default function MaterialsPage() {
  const { t } = useTranslation()
  const [isFormOpen, setIsFormOpen] = React.useState(true)
  const [openCategory, setOpenCategory] = React.useState(false)
  const [materials, setMaterials] = React.useState<Material[]>([])
  const [categories, setCategories] = React.useState<MaterialCategory[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [addingCategory, setAddingCategory] = React.useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = React.useState<number | null>(null)

  const [formData, setFormData] = React.useState({
    name: "",
    categoryId: "",
    quantity: "100",
    totalPrice: "100",
    link: "",
    purchaseDate: new Date(),
    usagePerUnit: "100"
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
    purchaseDate: new Date(),
    usagePerUnit: ""
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
      return { matData, catData }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      return { matData: [] as Material[], catData: [] as MaterialCategory[] }
    }
  }, [])

  const [filterCategory, setFilterCategory] = React.useState("all")
  const [filterStatus, setFilterStatus] = React.useState("all")

  React.useEffect(() => {
    let active = true

    const load = async () => {
      const { matData, catData } = await fetchData()
      if (!active) {
        return
      }

      setMaterials(matData)
      setCategories(catData)
      setLoading(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [fetchData])

  const filteredMaterials = materials.filter(m => {
    const categoryMatch = filterCategory === "all" || m.CategoryID?.toString() === filterCategory
    const statusMatch = filterStatus === "all" || (
      filterStatus === "stock" ? (m.Quantity || 0) >= 10 : (m.Quantity || 0) < 10
    )
    return categoryMatch && statusMatch
  })

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
          name: formData.name,
          purchaseDate: formData.purchaseDate.toISOString(),
          usagePerUnit: parseInt(formData.usagePerUnit)
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
          purchaseDate: new Date(),
          usagePerUnit: "100"
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
      purchaseDate: m.PurchaseDate ? new Date(m.PurchaseDate) : new Date(),
      usagePerUnit: (m.UsagePerUnit || 50).toString()
    })
    setIsEditOpen(true)
  }

  const isFieldChanged = (field: string, value: string | Date) => {
    if (!originalMaterial) return false
    switch (field) {
      case "name": return value !== originalMaterial.Name
      case "categoryId": return value !== originalMaterial.CategoryID.toString()
      case "quantity": return value !== originalMaterial.Quantity.toString()
      case "totalPrice": return value !== originalMaterial.TotalPrice.toString()
      case "link": return value !== (originalMaterial.Link || "")
      case "purchaseDate": return value instanceof Date && value.toDateString() !== new Date(originalMaterial.PurchaseDate).toDateString()
      case "usagePerUnit": return value !== (originalMaterial.UsagePerUnit || 50).toString()
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
          name: editFormData.name,
          purchaseDate: editFormData.purchaseDate.toISOString(),
          usagePerUnit: parseInt(editFormData.usagePerUnit)
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
  const hasMaterialChanges =
    !!originalMaterial &&
    (
      isFieldChanged("name", editFormData.name) ||
      isFieldChanged("categoryId", editFormData.categoryId) ||
      isFieldChanged("quantity", editFormData.quantity) ||
      isFieldChanged("totalPrice", editFormData.totalPrice) ||
      isFieldChanged("link", editFormData.link) ||
      isFieldChanged("purchaseDate", editFormData.purchaseDate) ||
      isFieldChanged("usagePerUnit", editFormData.usagePerUnit)
    )

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
                            <span className="text-[10px] font-bold tracking-wider text-muted-foreground">{t("common.category")}</span>
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
                      <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("common.usage_per_unit")}</Label>
                      <Input
                        type="number"
                        step="5"
                        min="1"
                        max="100"
                        value={formData.usagePerUnit}
                        onChange={(e) => setFormData({ ...formData, usagePerUnit: e.target.value })}
                        required
                        className="bg-background/40 border-muted/30 text-left"
                      />
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

          <CategoryCard
            id="category-management"
            title={t("common.add_category")}
            description={t("materials.categories_desc")}
            categories={categories}
            onAdd={async (name) => {
              setAddingCategory(true)
              try {
                const response = await fetch("http://localhost:3001/api/material-categories", {
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
                    <TableRow className="hover:bg-transparent border-muted/20">
                      <TableHead className="font-semibold px-6 w-[25%]">{t("models.table.name")}</TableHead>
                      <TableHead className="font-semibold text-center w-[20%]">
                        <div className="flex items-center justify-center gap-1">
                          {t("common.category")}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-muted/30">
                                <Filter className={cn("h-3 w-3", filterCategory !== "all" && "text-primary fill-primary")} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-40">
                              <DropdownMenuItem onClick={() => setFilterCategory("all")} className="flex items-center justify-between">
                                {t("common.all")} {filterCategory === "all" && <Check className="h-3 w-3" />}
                              </DropdownMenuItem>
                              {categories.map((cat) => (
                                <DropdownMenuItem key={cat.ID} onClick={() => setFilterCategory(cat.ID.toString())} className="flex items-center justify-between text-xs">
                                  {cat.Name} {filterCategory === cat.ID.toString() && <Check className="h-3 w-3" />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-center w-[15%]">{t("materials.table.unit_price")}</TableHead>
                      <TableHead className="font-semibold text-center w-[15%] whitespace-nowrap">{t("materials.table.unit_usage")}</TableHead>
                      <TableHead className="font-semibold text-center w-[15%]">
                        <div className="flex items-center justify-center gap-1">
                          {t("materials.table.current")}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-muted/30">
                                <Filter className={cn("h-3 w-3", filterStatus !== "all" && "text-primary fill-primary")} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-40">
                              <DropdownMenuItem onClick={() => setFilterStatus("all")} className="flex items-center justify-between">
                                {t("common.all")} {filterStatus === "all" && <Check className="h-3 w-3" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setFilterStatus("stock")} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                  {t("filament.status.in_stock")}
                                </div>
                                {filterStatus === "stock" && <Check className="h-3 w-3" />}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setFilterStatus("low")} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-destructive" />
                                  {t("filament.status.low_stock")}
                                </div>
                                {filterStatus === "low" && <Check className="h-3 w-3" />}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableHead>
                      <TableHead className="w-[10%] px-6 text-right">
                        {(filterCategory !== "all" || filterStatus !== "all") && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => { setFilterCategory("all"); setFilterStatus("all"); }}
                            title={t("common.clear_filters")}
                          >
                            <FilterX className="h-3 w-3" />
                          </Button>
                        )}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground opacity-50">
                          <Search className="h-12 w-12 mx-auto mb-2" />
                          <p>{t("common.no_data")}</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMaterials.map((m) => (
                        <TableRow key={m.ID} className="hover:bg-muted/5 transition-colors border-muted/10 h-16">
                          <TableCell className="px-6 font-medium">{m.Name}</TableCell>
                          <TableCell className="text-center">
                            <span className="px-2 py-0.5 rounded-full bg-muted/20 text-[11px]">
                              {m.CategoryName}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {m.Quantity > 0 ? (m.TotalPrice / m.Quantity).toFixed(2) : "0.00"}
                          </TableCell>
                          <TableCell className="text-center font-bold">{m.UsagePerUnit ?? 100}%</TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1 w-full mx-auto max-w-[100px]">
                              <div className="flex justify-between w-full text-[9px] font-bold tracking-tighter text-muted-foreground/60 uppercase">
                                <span>{m.Quantity} Adet</span>
                                <span>Envanter</span>
                              </div>
                              <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden border border-muted/10">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all duration-700",
                                    (m.Quantity < 10) ? 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]'
                                  )}
                                  style={{ width: `${Math.min(100, (m.Quantity / 500) * 100)}%` }}
                                />
                              </div>
                            </div>
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
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("common.category")}</p>
                <p className="text-sm font-semibold">{selectedMaterial?.CategoryName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("materials.quantity")}</p>
                <p className="text-sm font-semibold">{selectedMaterial?.Quantity} Adet</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("materials.total_price")}</p>
                <p className="text-sm font-semibold">{selectedMaterial?.TotalPrice}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t("materials.table.unit_price")}</p>
                <p className="text-sm font-semibold">
                  {selectedMaterial ? (selectedMaterial.TotalPrice / selectedMaterial.Quantity).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>

            <div className="space-y-1 p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-primary/70">{t("common.registration_date")}</p>
                    <p className="text-sm font-medium">{selectedMaterial?.PurchaseDate ? new Date(selectedMaterial.PurchaseDate).toLocaleDateString('tr-TR') : "-"}</p>
                  </div>
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-muted/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <Edit3 className="h-6 w-6 text-primary" />
              {t("common.edit")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("materials.name")}</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
                className="bg-background/40 border-muted/30 h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("common.category")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-background/40 border-muted/30 h-10">
                    {editFormData.categoryId ? categories.find(c => c.ID.toString() === editFormData.categoryId)?.Name : t("common.select")}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder={t("common.search")} />
                    <CommandList>
                      <CommandGroup>
                        {categories.map(c => (
                          <CommandItem key={c.ID} onSelect={() => setEditFormData({ ...editFormData, categoryId: c.ID.toString() })}>
                            <Check className={cn("mr-2 h-4 w-4", editFormData.categoryId === c.ID.toString() ? "opacity-100" : "opacity-0")} />
                            {c.Name}
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
                  value={editFormData.quantity}
                  onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("materials.total_price")}</Label>
                <Input
                  type="number"
                  value={editFormData.totalPrice}
                  onChange={(e) => setEditFormData({ ...editFormData, totalPrice: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("common.usage_per_unit")}</Label>
              <Input
                type="number"
                step="5"
                min="1"
                max="100"
                value={editFormData.usagePerUnit}
                onChange={(e) => setEditFormData({ ...editFormData, usagePerUnit: e.target.value })}
                required
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={updating || !hasMaterialChanges} className="w-full">
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.update")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
