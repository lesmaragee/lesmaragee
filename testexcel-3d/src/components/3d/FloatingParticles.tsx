import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 200;

// Generated outside the component to satisfy React Hook purity
const PARTICLES = Array.from({ length: COUNT }, () => ({
  position: new THREE.Vector3(
    (Math.random() - 0.5) * 35,
    (Math.random() - 0.5) * 35,
    Math.random() * 30 - 5
  ),
  scale: Math.random() * 0.14 + 0.03,
  speed: Math.random() * 0.5 + 0.1,
  phase: Math.random() * Math.PI * 2,
}));

export default function FloatingParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    PARTICLES.forEach((p, i) => {
      const drift = Math.sin(t * p.speed + p.phase) * 0.6;
      const sway = Math.cos(t * p.speed * 0.7 + p.phase) * 0.6;
      dummy.position.set(
        p.position.x + sway,
        p.position.y + drift,
        p.position.z
      );
      dummy.scale.setScalar(p.scale);
      dummy.rotation.set(t * p.speed, t * p.speed * 0.5, 0);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Whole field parallax against pointer
    if (groupRef.current) {
      groupRef.current.position.x = -state.pointer.x * 0.8;
      groupRef.current.position.y = -state.pointer.y * 0.8;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#111111"
          emissive="#fafafa"
          emissiveIntensity={0.35}
          roughness={0.1}
          metalness={0.9}
        />
      </instancedMesh>
    </group>
  );
}
