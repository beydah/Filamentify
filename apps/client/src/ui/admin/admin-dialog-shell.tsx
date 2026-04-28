import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/controls/dialog"

interface AdminDialogShellProps {
  title: string
  description?: string
  icon?: LucideIcon
  className?: string
  children: ReactNode
}

export function AdminDialogShell({
  title,
  description,
  icon: Icon,
  className = "max-w-2xl bg-background/95 backdrop-blur-xl border-muted/30",
  children,
}: AdminDialogShellProps) {
  return (
    <DialogContent className={className}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
          {Icon ? <Icon className="h-6 w-6 text-primary" /> : null}
          {title}
        </DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
      {children}
    </DialogContent>
  )
}
