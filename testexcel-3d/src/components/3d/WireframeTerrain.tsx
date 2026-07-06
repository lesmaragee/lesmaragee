import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function WireframeTerrain() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    // Infinite forward-scroll illusion (grid cell size = 2)
    meshRef.current.position.z = ((t * 2) % 2);
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -4, 0]}
    >
      <planeGeometry args={[100, 100, 50, 50]} />
      <meshBasicMaterial
        color="#d6d6d6"
        wireframe
        transparent
        opacity={0.08}
      />
    </mesh>
  );
}
