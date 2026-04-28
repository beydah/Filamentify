import * as React from "react"
import { useTranslation } from "react-i18next"
import { buildProtectedFileUrl } from "@/lib/api"

const LazyModelViewerCanvas = React.lazy(() => import("./model-viewer-canvas"))

interface ModelViewerProps {
  filePath?: string | null
  emptyClassName?: string
  viewerClassName?: string
}

export function ModelViewer({
  filePath,
  emptyClassName = "flex h-full items-center justify-center text-muted-foreground",
  viewerClassName = "h-[300px] w-full rounded-lg border bg-muted/20 relative group overflow-hidden",
}: ModelViewerProps) {
  const { t } = useTranslation()

  if (!filePath) {
    return <div className={emptyClassName}>{t("models.details.no_file")}</div>
  }

  const isStl = filePath.toLowerCase().endsWith(".stl")
  if (!isStl) {
    return (
      <div className={emptyClassName}>
        {t("models.details.format_error", { format: filePath.split(".").pop() })}
      </div>
    )
  }

  const url = buildProtectedFileUrl(filePath)
  if (!url) {
    return <div className={emptyClassName}>{t("models.details.no_file")}</div>
  }

  return (
    <div className={viewerClassName}>
      <React.Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">{t("common.loading")}</div>}>
        <LazyModelViewerCanvas url={url} />
      </React.Suspense>
    </div>
  )
}
