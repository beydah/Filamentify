import { Search } from "lucide-react"

interface TableEmptyStateProps {
  colSpan: number
  label: string
}

export function TableEmptyState({ colSpan, label }: TableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="h-48 text-center text-muted-foreground opacity-50">
        <Search className="mx-auto mb-2 h-12 w-12" />
        <p>{label}</p>
      </td>
    </tr>
  )
}
