import * as React from "react"
import { Plus, X } from "lucide-react"
import type { RelationDraft } from "@/lib/admin-types"
import { Button } from "@/ui/controls/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/ui/controls/command"
import { Input } from "@/ui/controls/input"
import { Label } from "@/ui/controls/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/controls/popover"

interface RelationOption {
  id: number
  name: string
  meta?: string
}

interface RelationPickerProps {
  title: string
  addLabel: string
  searchPlaceholder: string
  emptyLabel: string
  values: RelationDraft[]
  options: RelationOption[]
  onChange: (values: RelationDraft[]) => void
  quantityLabel: string
  quantityMin?: number
  quantityMax?: number
  quantityStep?: number
  suffix?: string
}

export function RelationPicker({
  title,
  addLabel,
  searchPlaceholder,
  emptyLabel,
  values,
  options,
  onChange,
  quantityLabel,
  quantityMin = 1,
  quantityMax = 100000,
  quantityStep = 1,
  suffix = "",
}: RelationPickerProps) {
  const [open, setOpen] = React.useState(false)

  const availableOptions = React.useMemo(
    () => options.filter((option) => !values.some((value) => value.id === option.id)),
    [options, values],
  )

  return (
    <div className="space-y-3 rounded-xl border border-muted/20 bg-muted/10 p-4">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold tracking-wider text-muted-foreground">{title}</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
              <Plus className="h-3 w-3" />
              {addLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="end">
            <Command>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList className="max-h-[220px] overflow-y-auto scrollbar-none">
                <CommandEmpty>{emptyLabel}</CommandEmpty>
                <CommandGroup>
                  {availableOptions.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={`${option.name} ${option.meta || ""}`.trim()}
                      onSelect={() => {
                        onChange([...values, { id: option.id, quantity: quantityMin }])
                        setOpen(false)
                      }}
                    >
                      <div className="min-w-0">
                        <div className="truncate">{option.name}</div>
                        {option.meta ? <div className="truncate text-[10px] text-muted-foreground">{option.meta}</div> : null}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {values.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-2">
          {values.map((value) => {
            const option = options.find((entry) => entry.id === value.id)

            return (
              <div key={value.id} className="flex items-center gap-2 rounded-lg border border-muted/20 bg-background/70 p-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{option?.name || `#${value.id}`}</div>
                  {option?.meta ? <div className="truncate text-[10px] text-muted-foreground">{option.meta}</div> : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{quantityLabel}</span>
                  <Input
                    type="number"
                    min={quantityMin}
                    max={quantityMax}
                    step={quantityStep}
                    value={value.quantity}
                    className="h-8 w-20 text-xs"
                    onChange={(event) => {
                      const nextQuantity = Number(event.target.value || quantityMin)
                      onChange(
                        values.map((entry) =>
                          entry.id === value.id
                            ? { ...entry, quantity: Math.min(quantityMax, Math.max(quantityMin, nextQuantity)) }
                            : entry,
                        ),
                      )
                    }}
                  />
                  {suffix ? <span className="text-xs text-muted-foreground">{suffix}</span> : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onChange(values.filter((entry) => entry.id !== value.id))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
