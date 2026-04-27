import * as React from "react"
import { FileImage, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/ui/controls/button"
import { Input } from "@/ui/controls/input"
import { Label } from "@/ui/controls/label"

interface ImageUploadFieldProps {
  id: string
  label: string
  file: File | null
  onChange: (file: File | null) => void
  invalidTypeMessage: string
}

export function ImageUploadField({
  id,
  label,
  file,
  onChange,
  invalidTypeMessage,
}: ImageUploadFieldProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const acceptFile = React.useCallback(
    (nextFile: File | null) => {
      if (!nextFile) {
        onChange(null)
        return
      }

      if (!nextFile.type.startsWith("image/")) {
        toast.error(invalidTypeMessage)
        return
      }

      onChange(nextFile)
    },
    [invalidTypeMessage, onChange],
  )

  const previewUrl = React.useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-semibold tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          acceptFile(event.dataTransfer.files[0] ?? null)
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative h-24 w-full rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden",
          isDragging ? "border-primary bg-primary/5 scale-[0.98]" : "border-muted/30 hover:border-muted/50 bg-muted/10",
          file ? "border-solid border-primary/40 bg-background" : "",
        )}
      >
        <Input
          id={id}
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={(event) => acceptFile(event.target.files?.[0] ?? null)}
        />

        {file && previewUrl ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity">
              <FileImage className="h-6 w-6 text-primary" />
            </div>
            <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full shadow-lg"
              onClick={(event) => {
                event.stopPropagation()
                onChange(null)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <>
            <Upload className={cn("h-5 w-5", isDragging ? "text-primary animate-bounce" : "text-muted-foreground")} />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Drag and drop</span>
          </>
        )}
      </div>
    </div>
  )
}
