import * as React from "react"
import { useTranslation } from "react-i18next"
import { Canvas, useLoader } from "@react-three/fiber"
import { Center, OrbitControls, Stage } from "@react-three/drei"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"
import { buildProtectedFileUrl } from "@/lib/api"

function STLModel({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url)
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#888888" />
    </mesh>
  )
}

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
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Stage intensity={0.5} environment="city" adjustCamera={1.5}>
          <React.Suspense fallback={null}>
            <Center>
              <STLModel url={url} />
            </Center>
          </React.Suspense>
        </Stage>
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  )
}
