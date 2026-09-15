import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls } from '@react-three/drei'
import { useRef } from 'react'

function Box({ args, position, color, emissive = '#000000' }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.48} metalness={0.12} emissive={emissive} emissiveIntensity={0.08} />
    </mesh>
  )
}

function ResidenceModel() {
  const group = useRef()

  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.2
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.025
  })

  return (
    <group ref={group} rotation={[0, -0.28, 0]}>
      <Box args={[3.6, 0.12, 2.7]} position={[0, -0.76, 0]} color="#d8eadf" />
      <Box args={[1.5, 2.8, 0.8]} position={[0, 0.65, 0]} color="#f7faf8" />
      <Box args={[0.9, 2.1, 0.74]} position={[-1.1, 0.3, -0.05]} color="#d9f2e4" />
      <Box args={[0.85, 1.8, 0.72]} position={[1.08, 0.14, -0.08]} color="#ffe1dd" />
      {[-0.42, 0, 0.42].map((x) =>
        [-0.32, 0.16, 0.64, 1.12, 1.6].map((y) => (
          <Box key={`${x}-${y}`} args={[0.22, 0.18, 0.035]} position={[x, y, 0.43]} color="#fff7d6" emissive="#f6b85a" />
        )),
      )}
      {[-0.42, 0.42].map((x) =>
        [0.38, 0.86, 1.34].map((y) => (
          <Box key={`balcony-${x}-${y}`} args={[0.48, 0.05, 0.22]} position={[x, y - 0.18, 0.62]} color="#b8e8d0" />
        )),
      )}
      {[-0.62, 0.62].map((x) =>
        [0.2, 0.68, 1.16].map((y) => (
          <Box key={`rail-${x}-${y}`} args={[0.04, 0.24, 0.04]} position={[x, y, 0.73]} color="#0f3d32" />
        )),
      )}
      {[-1.28, -0.92, 0.9, 1.22].map((x) =>
        [-0.36, 0.12, 0.6, 1.08].map((y) => (
          <Box key={`${x}-${y}`} args={[0.18, 0.16, 0.035]} position={[x, y, 0.36]} color="#f9fffb" emissive="#b8e8d0" />
        )),
      )}
      <Box args={[0.42, 0.6, 0.05]} position={[0, -0.45, 0.45]} color="#0f3d32" />
      <Box args={[1.8, 0.08, 1]} position={[0, 2.1, 0]} color="#087f5b" />
      <Box args={[0.35, 0.52, 0.32]} position={[-1.72, -0.48, 0.68]} color="#16a085" />
      <Box args={[0.35, 0.52, 0.32]} position={[1.72, -0.48, 0.68]} color="#16a085" />
      <Float speed={1.4} floatIntensity={0.25}>
        <mesh position={[1.72, 1.45, 0.1]} castShadow>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color="#ff6b5f" roughness={0.38} />
        </mesh>
      </Float>
    </group>
  )
}

function ResidenceStory3D() {
  return (
    <div className="residence-3d">
      <Canvas shadows camera={{ position: [0, 1.4, 5.2], fov: 42 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.78} />
        <directionalLight position={[-3, 5, 4]} intensity={1.2} castShadow />
        <pointLight position={[3, 2.3, 2]} color="#ffb86a" intensity={0.65} />
        <ResidenceModel />
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2.1} minPolarAngle={Math.PI / 3.2} />
      </Canvas>
    </div>
  )
}

export default ResidenceStory3D
