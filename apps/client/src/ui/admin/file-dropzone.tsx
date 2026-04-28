import * as React from "react"
import { FileText, FileUp, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/ui/controls/button"
import { Input } from "@/ui/controls/input"
import { Label } from "@/ui/controls/label"

interface FileDropzoneProps {
  id: string
  label: string
  file: File | null
  accept: string
  emptyTitle: string
  emptyHint: string
  onChange: (file: File | null) => void
  validate: (file: File) => boolean
}

export function FileDropzone({
  id,
  label,
  file,
  accept,
  emptyTitle,
  emptyHint,
  onChange,
  validate,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const acceptFile = React.useCallback(
    (nextFile: File | null) => {
      if (!nextFile) {
        onChange(null)
        return
      }

      if (!validate(nextFile)) {
        return
      }

      onChange(nextFile)
    },
    [onChange, validate],
  )

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
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-all duration-200",
          file ? "border-primary/50 bg-primary/5" : "border-muted/30 bg-background/40",
          isDragging ? "scale-[1.02] border-primary bg-primary/10" : "",
        )}
      >
        <Input
          id={id}
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={(event) => acceptFile(event.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <FileText className="h-8 w-8 text-primary" />
            <div className="text-center">
              <p className="max-w-[180px] truncate text-xs font-medium">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
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
            <FileUp className={cn("h-8 w-8 transition-colors", isDragging ? "text-primary" : "text-muted-foreground/50")} />
            <div className="text-center">
              <p className="text-xs font-medium">{emptyTitle}</p>
              <p className="text-[10px] text-muted-foreground">{emptyHint}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
