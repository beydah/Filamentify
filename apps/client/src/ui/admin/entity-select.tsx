import type { ReactNode } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/ui/controls/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/ui/controls/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/controls/popover"

export interface EntitySelectOption {
  value: string
  label: string
  meta?: string
}

interface EntitySelectProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onChange: (value: string) => void
  placeholder: string
  searchPlaceholder: string
  emptyLabel: string
  options: EntitySelectOption[]
  headerLabel?: string
  headerAction?: ReactNode
  className?: string
  disabled?: boolean
}

export function EntitySelect({
  open,
  onOpenChange,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  options,
  headerLabel,
  headerAction,
  className,
  disabled,
}: EntitySelectProps) {
  const selected = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between bg-background/40 px-3 font-normal", className)}
        >
          <span className="truncate">{selected?.label || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        {headerLabel || headerAction ? (
          <div className="flex items-center justify-between border-b border-muted/20 bg-muted/5 p-2">
            {headerLabel ? <span className="text-[10px] font-bold tracking-wider text-muted-foreground">{headerLabel}</span> : <span />}
            {headerAction}
          </div>
        ) : null}
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[220px] overflow-y-auto scrollbar-none">
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.meta || ""}`.trim()}
                  onSelect={() => {
                    onChange(option.value)
                    onOpenChange(false)
                  }}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Check className={cn("h-4 w-4 text-primary", value === option.value ? "opacity-100" : "opacity-0")} />
                    <div className="min-w-0">
                      <div className="truncate">{option.label}</div>
                      {option.meta ? <div className="truncate text-[10px] text-muted-foreground">{option.meta}</div> : null}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
