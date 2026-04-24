import * as React from "react"
import { useTranslation } from "react-i18next"
import { 
  Plus, 
  Loader2, 
  Tag, 
  ExternalLink,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Check,
  ChevronsUpDown,
  FileUp,
  Filter,
  FilterX,
  Box,
  FileText,
  Eye,
  Edit3 as Edit3Icon,
  Minus
} from "lucide-react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stage, Center } from "@react-three/drei"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"
import { Calendar } from "@/ui/controls/calendar"
import { subMonths } from "date-fns"
import { useLoader } from "@react-three/fiber"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/ui/controls/button"
import { Input } from "@/ui/controls/input"
import { Label } from "@/ui/controls/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/controls/card"
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
  CommandItem,
  CommandList,
  CommandInput,
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

interface ModelCategory {
  ID: number
  Name: string
}

interface Model {
  ID: number
  CategoryID: number
  CategoryName: string
  Name: string
  Link: string
  Gram: number
  PieceCount: number
  FilePath?: string
}

function STLModel({ url }: { url: string }) {
  const geom = useLoader(STLLoader, url)
  return (
    <mesh geometry={geom}>
      <meshStandardMaterial color="#888888" />
    </mesh>
  )
}

function ModelViewer({ filePath }: { filePath?: string }) {
  const { t } = useTranslation()
  if (!filePath) return <div className="flex h-full items-center justify-center text-muted-foreground">{t("models.details.no_file")}</div>
  
  const url = `http://localhost:3001/${filePath}`
  const isSTL = filePath.toLowerCase().endsWith('.stl')

  if (!isSTL) {
    return <div className="flex h-full items-center justify-center text-muted-foreground font-medium italic">
      {t("models.details.format_error", { format: filePath.split('.').pop() })}
    </div>
  }

  return (
    <div className="h-[300px] w-full rounded-lg border bg-muted/20 relative group overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Stage intensity={0.5} environment="city" adjustCamera={1.5}>
          <React.Suspense fallback={null}>
            {isSTL ? (
              <Center>
                <STLModel url={url} />
              </Center>
            ) : (
              <Center>
                <mesh>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="orange" />
                </mesh>
              </Center>
            )}
          </React.Suspense>
        </Stage>
        <OrbitControls makeDefault />
      </Canvas>
      <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
        {t("models.details.preview")}
      </div>
    </div>
  )
}

const toTitleCase = (str: string) => {
  return str;
}

export default function ModelsPage() {
  const { t } = useTranslation()
  
  const [models, setModels] = React.useState<Model[]>([])
  const [categories, setCategories] = React.useState<ModelCategory[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [addingCategory, setAddingCategory] = React.useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = React.useState<number | null>(null)
  
  const [isFormOpen, setIsFormOpen] = React.useState(true)
  const [isCategoriesOpen, setIsCategoriesOpen] = React.useState(false)

  const [editingModel, setEditingModel] = React.useState<Model | null>(null)
  const [originalModel, setOriginalModel] = React.useState<Model | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [updateSuccess, setUpdateSuccess] = React.useState(false)
  const [editFormData, setEditFormData] = React.useState({
    name: "",
    categoryId: "",
    link: "",
    gram: "",
    pieceCount: "",
    file: null as File | null
  })
  const [updating, setUpdating] = React.useState(false)

  const [newCategory, setNewCategory] = React.useState("")
  const [formData, setFormData] = React.useState({
    name: "",
    categoryId: "",
    link: "",
    gram: "5.00",
    pieceCount: "1",
    file: null as File | null
  })

  const [detailModel, setDetailModel] = React.useState<Model | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)

  const [openCategory, setOpenCategory] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isDraggingEdit, setIsDraggingEdit] = React.useState(false)

  const [filterCategory, setFilterCategory] = React.useState<string>("all")

  const filteredModels = models.filter(m => {
    if (filterCategory !== "all" && m.CategoryName !== filterCategory) return false
    return true
  })

  const isFormValid = formData.name && formData.categoryId && formData.gram && formData.pieceCount

  const fetchData = React.useCallback(async () => {
    try {
      const [modRes, catRes] = await Promise.all([
        fetch("http://localhost:3001/api/models"),
        fetch("http://localhost:3001/api/model-categories"),
      ])
      const modData = await modRes.json()
      const catData = await catRes.json()
      setModels(modData)
      setCategories(catData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    setAddingCategory(true)
    try {
      const response = await fetch("http://localhost:3001/api/model-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: toTitleCase(newCategory)
        })
      })
      if (response.ok) {
        setNewCategory("")
        fetchData()
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
      const response = await fetch(`http://localhost:3001/api/model-categories/${id}`, {
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
      console.error("Failed to delete category:", error)
    } finally {
      setDeletingCategoryId(null)
    }
  }

  const handleDeleteModel = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/models/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success(t("common.notifications.deleted"))
        fetchData()
      } else {
        toast.error(t("common.notifications.delete_error"))
      }
    } catch (error) {
      console.error("Failed to delete model:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.categoryId || !formData.name || !formData.gram) {
      return
    }
    setSubmitting(true)
    try {
      const data = new FormData()
      data.append("categoryId", formData.categoryId)
      data.append("name", toTitleCase(formData.name))
      data.append("link", formData.link)
      data.append("gram", formData.gram)
      data.append("pieceCount", formData.pieceCount)
      if (formData.file) {
        data.append("file", formData.file)
      }

      const response = await fetch("http://localhost:3001/api/models", {
        method: "POST",
        body: data,
      })

      if (response.ok) {
        toast.success(t("common.notifications.added"))
        setFormData({
          categoryId: "",
          name: "",
          link: "",
          gram: "5.00",
          pieceCount: "1",
          file: null,
        })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to add model:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditClick = (model: Model) => {
    setEditingModel(model)
    setOriginalModel(model)
    setEditFormData({
      name: model.Name,
      categoryId: model.CategoryID.toString(),
      link: model.Link || "",
      gram: model.Gram.toString(),
      pieceCount: (model.PieceCount || 1).toString(),
      file: null
    })
    setIsEditDialogOpen(true)
  }

  const isFieldChanged = (field: string, value: any) => {
    if (!originalModel) return false
    switch (field) {
      case "name": return value !== originalModel.Name
      case "categoryId": return value !== originalModel.CategoryID.toString()
      case "link": return value !== (originalModel.Link || "")
      case "gram": return value !== originalModel.Gram.toString()
      case "pieceCount": return value !== (originalModel.PieceCount || 1).toString()
      case "file": return value !== null
      default: return false
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingModel) return
    setUpdating(true)
    try {
      const data = new FormData()
      data.append("name", toTitleCase(editFormData.name))
      data.append("categoryId", editFormData.categoryId)
      data.append("link", editFormData.link)
      data.append("gram", editFormData.gram)
      data.append("pieceCount", editFormData.pieceCount)
      if (editFormData.file) {
        data.append("file", editFormData.file)
      }

      const response = await fetch(`http://localhost:3001/api/models/${editingModel.ID}`, {
        method: "PATCH",
        body: data,
      })
      if (response.ok) {
        setUpdateSuccess(true)
        setTimeout(() => {
          setIsEditDialogOpen(false)
          setUpdateSuccess(false)
          fetchData()
        }, 1000)
      }
    } catch (error) {
      console.error("Failed to update model:", error)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {t("nav.models")}
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-muted/40 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Box className="h-4 w-4 text-primary" />
                  {t("models.new_record")}
                </CardTitle>
                <CardDescription>
                  {t("models.new_record_desc")}
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
                      <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("models.name")}</Label>
                      <Input
                        placeholder={t("models.name_placeholder")}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-background/40 border-muted/30 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("models.category")}</Label>
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
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("models.category")}</span>
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
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.categoryId === cat.ID.toString() ? "opacity-100" : "opacity-0"
                                      )}
                                    />
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
                        <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("models.gram")}</Label>
                        <Input
                          type="number"
                          step="1.00"
                          min="2.00"
                          value={formData.gram}
                          onChange={(e) => setFormData({ ...formData, gram: e.target.value })}
                          required
                          className="bg-background/40 border-muted/30 text-left transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("models.piece_count")}</Label>
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          placeholder={t("models.piece_count_placeholder")}
                          value={formData.pieceCount}
                          onChange={(e) => setFormData({ ...formData, pieceCount: e.target.value })}
                          required
                          className="bg-background/40 border-muted/30 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("models.link")}</Label>
                      <Input
                        placeholder={t("models.link_placeholder")}
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        className="bg-background/40 border-muted/30 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs tracking-wider text-muted-foreground font-semibold">{t("models.file_upload")}</Label>
                      <div 
                        className={cn(
                          "border-2 border-dashed rounded-lg p-4 transition-all duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer",
                          formData.file ? "border-primary/50 bg-primary/5" : "border-muted/30",
                          isDragging && "border-primary bg-primary/10 scale-[1.02]"
                        )}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.name.endsWith('.stl')) {
                            setFormData({ ...formData, file });
                          }
                        }}
                        onClick={() => document.getElementById('model-file-input')?.click()}
                      >
                        <input 
                          id="model-file-input"
                          type="file" 
                          className="hidden" 
                          accept=".stl"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setFormData({ ...formData, file });
                          }}
                        />
                        {formData.file ? (
                          <>
                            <FileText className="h-8 w-8 text-primary" />
                            <div className="text-center">
                              <p className="text-xs font-medium truncate max-w-[150px]">{formData.file.name}</p>
                              <p className="text-[10px] text-muted-foreground">{(formData.file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-full" 
                              onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, file: null }); }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <FileUp className={cn("h-8 w-8 transition-colors", isDragging ? "text-primary" : "text-muted-foreground/50")} />
                            <div className="text-center">
                              <p className="text-xs font-medium">{isDragging ? "Buraya Bırakın" : t("models.drag_drop")}</p>
                              <p className="text-[10px] text-muted-foreground">{t("models.only_stl")}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-10 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
                      disabled={submitting || !isFormValid}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("models.saving")}
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          {t("models.save")}
                        </>
                      )}
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
                  {t("models.categories_desc")}
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
                      placeholder={t("models.add_category_placeholder")}
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="bg-background/40 border-muted/30 focus:border-primary/50 transition-all"
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
          <Card className="h-full border-muted/40 bg-card/40 backdrop-blur-md shadow-lg flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{t("models.library")}</CardTitle>
                  <CardDescription>
                    {t("models.library_desc")}
                  </CardDescription>
                </div>
                <div className="bg-muted/30 px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground border border-muted/20">
                  {t("models.total")}: {models.length}
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
                    <TableHead className="font-semibold px-6 w-[30%]">{t("models.table.name")}</TableHead>
                    <TableHead className="font-semibold text-center w-[25%]">
                      <div className="flex items-center justify-center gap-1">
                        {t("models.table.category")}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-muted/30">
                              <Filter className={cn("h-3 w-3", filterCategory !== "all" && "text-primary fill-primary")} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" className="w-40">
                            <DropdownMenuItem onClick={() => setFilterCategory("all")}>{t("common.all")}</DropdownMenuItem>
                            {categories.map(c => (
                              <DropdownMenuItem key={c.ID} onClick={() => setFilterCategory(c.Name)}>{c.Name}</DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center w-[12%]">{t("models.table.gram")}</TableHead>
                    <TableHead className="font-semibold text-center w-[13%]">{t("models.table.piece_count")}</TableHead>
                    <TableHead className="font-semibold text-center w-[10%]">{t("models.table.link")}</TableHead>
                    <TableHead className="w-[10%] px-6 text-right">
                      {filterCategory !== "all" && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => setFilterCategory("all")}
                          title="Filtreleri Temizle"
                        >
                          <FilterX className="h-3 w-3" />
                        </Button>
                      )}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center text-muted-foreground opacity-50">
                        <Search className="h-12 w-12 mx-auto mb-2" />
                        <p>{t("models.table.no_data")}</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredModels.map((model) => (
                      <TableRow key={model.ID} className="hover:bg-muted/5 transition-colors border-muted/10 h-16">
                        <TableCell className="font-medium px-6">{model.Name}</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 rounded-full bg-muted/20 text-[11px]">
                            {model.CategoryName}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-bold">{(model.Gram || 0).toFixed(2)}g</TableCell>
                        <TableCell className="text-center">{(model.PieceCount || 1)}x</TableCell>
                        <TableCell className="text-center">
                          {model.Link ? (
                            <a href={model.Link} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              Link
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
                              <DropdownMenuItem onClick={() => { setDetailModel(model); setIsDetailOpen(true); }} className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                {t("common.details")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditClick(model)} className="cursor-pointer">
                                <Edit3 className="mr-2 h-4 w-4" />
                                {t("common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteModel(model.ID)}
                                className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
                              >
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("models.edit_dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("models.edit_dialog.desc")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{t("models.name")}</Label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                  className={cn(isFieldChanged("name", editFormData.name) && "border-yellow-400 ring-1 ring-yellow-400/50")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">{t("models.category")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-between font-normal", isFieldChanged("categoryId", editFormData.categoryId) && "border-yellow-400 ring-1 ring-yellow-400/50")}>
                      {categories.find(c => c.ID.toString() === editFormData.categoryId)?.Name || t("models.select_category")}
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
                  <Label className="text-xs font-semibold">{t("models.gram")}</Label>
                  <Input
                    type="number"
                    step="1.00"
                    min="2.00"
                    value={editFormData.gram}
                    onChange={(e) => setEditFormData({ ...editFormData, gram: e.target.value })}
                    required
                    className={cn("text-left", isFieldChanged("gram", editFormData.gram) && "border-yellow-400 ring-1 ring-yellow-400/50")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">{t("models.piece_count")}</Label>
                  <Input
                    type="number"
                    step="1"
                    value={editFormData.pieceCount}
                    onChange={(e) => setEditFormData({ ...editFormData, pieceCount: e.target.value })}
                    required
                    className={cn("text-left", isFieldChanged("pieceCount", editFormData.pieceCount) && "border-yellow-400 ring-1 ring-yellow-400/50")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">{t("models.link")}</Label>
                <Input
                  value={editFormData.link}
                  onChange={(e) => setEditFormData({ ...editFormData, link: e.target.value })}
                  className={cn(isFieldChanged("link", editFormData.link) && "border-yellow-400 ring-1 ring-yellow-400/50")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  Model Dosyası (.STL)
                </Label>
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-lg p-3 transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer",
                    (editFormData.file || isFieldChanged("file", editFormData.file)) ? "border-yellow-400 bg-yellow-400/5" : "border-muted/30",
                    isDraggingEdit && "border-primary bg-primary/10 scale-[1.02]"
                  )}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingEdit(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingEdit(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingEdit(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.name.endsWith('.stl')) {
                      setEditFormData({ ...editFormData, file });
                    }
                  }}
                  onClick={() => document.getElementById('edit-model-file-input')?.click()}
                >
                  <input 
                    id="edit-model-file-input"
                    type="file" 
                    className="hidden" 
                    accept=".stl"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setEditFormData({ ...editFormData, file });
                    }}
                  />
                  {editFormData.file ? (
                    <>
                      <FileText className="h-6 w-6 text-primary" />
                      <p className="text-[10px] font-medium truncate max-w-[150px]">{editFormData.file.name}</p>
                    </>
                  ) : (
                    <>
                      <FileUp className={cn("h-6 w-6 transition-colors", isDraggingEdit ? "text-primary" : "text-muted-foreground/50")} />
                      <p className="text-[10px] text-muted-foreground">
                        {isDraggingEdit ? "Buraya Bırakın" : (editingModel?.FilePath ? "Değiştir (.stl)" : "Ekle (.stl)")}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                <X className="mr-2 h-4 w-4" /> {t("common.cancel")}
              </Button>
              <Button 
                type="submit" 
                className={cn("flex-1", updateSuccess && "bg-green-600 hover:bg-green-700")}
                disabled={updating || updateSuccess}
              >
                {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : updateSuccess ? <Check className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                {updating ? t("models.saving") : updateSuccess ? t("common.updated") : t("models.edit_dialog.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-muted/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Box className="h-6 w-6 text-primary" />
              {detailModel?.Name}
            </DialogTitle>
            <DialogDescription>
              {t("models.details.desc")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-3 gap-4 bg-muted/20 p-4 rounded-xl border border-muted/30">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("models.category")}</p>
                <p className="text-sm font-semibold">{detailModel?.CategoryName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("models.details.weight")}</p>
                <p className="text-sm font-semibold">{detailModel?.Gram?.toFixed(2)}g</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("models.table.piece_count")}</p>
                <p className="text-sm font-semibold">{(detailModel?.PieceCount || 1)} {t("models.piece")}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("models.details.preview")}</p>
              <div className="rounded-xl overflow-hidden border border-muted/30 shadow-inner bg-black/5">
                <ModelViewer filePath={detailModel?.FilePath} />
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between items-center border-t border-muted/20 pt-4">
            <div className="flex items-center gap-2">
              {detailModel?.Link ? (
                <Button variant="outline" size="sm" asChild className="h-8 gap-2 border-primary/30 text-primary hover:bg-primary/5">
                  <a href={detailModel.Link} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t("models.link")}
                  </a>
                </Button>
              ) : (
                <span className="text-[10px] text-muted-foreground italic px-2">{t("models.details.no_link")}</span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)} className="h-8 px-6">{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
