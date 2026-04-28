import type { ReactNode } from "react"

interface AdminPageShellProps {
  title: string
  actions?: ReactNode
  children: ReactNode
}

export function AdminPageShell({ title, actions, children }: AdminPageShellProps) {
  return (
    <div className="flex flex-1 flex-col gap-8 p-6 pt-2">
      <div className="flex items-center justify-between gap-4">
        <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
          {title}
        </h1>
        {actions}
      </div>
      {children}
    </div>
  )
}
