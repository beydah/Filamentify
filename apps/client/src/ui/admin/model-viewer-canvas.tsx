import * as React from "react"
import { Canvas, useLoader } from "@react-three/fiber"
import { Center, OrbitControls, Stage } from "@react-three/drei"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"

function STLModel({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url)
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#888888" />
    </mesh>
  )
}

interface ModelViewerCanvasProps {
  url: string
}

export default function ModelViewerCanvas({ url }: ModelViewerCanvasProps) {
  return (
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
  )
}
