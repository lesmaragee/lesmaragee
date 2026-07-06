import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

export default function PaymentCard() {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const isMobile = viewport.width < 6;

  // Positioning mirrors the coin spec: right on desktop, centered-lower on mobile
  const scale = isMobile ? 0.9 : 1.25;
  const baseX = isMobile ? 0 : 2.6;
  const baseY = isMobile ? -2.6 : 0;

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    // Gentle bob
    group.current.position.y = Math.sin(t * 0.5) * 0.2 + baseY;
    group.current.position.x = baseX;

    // Slow showcase rotation (card sways rather than spins like a coin)
    group.current.rotation.y = Math.sin(t * 0.35) * 0.5 - 0.35;
    group.current.rotation.x = Math.sin(t * 0.4) * 0.08 + 0.12;

    // Mouse parallax tilt
    group.current.rotation.y += state.pointer.x * 0.25;
    group.current.rotation.x += -state.pointer.y * 0.15;
  });

  return (
    <group ref={group} scale={scale}>
      {/* Card body */}
      <RoundedBox args={[3.4, 2.15, 0.06]} radius={0.14} smoothness={6}>
        <meshStandardMaterial
          color="#141414"
          metalness={0.95}
          roughness={0.22}
          envMapIntensity={1.4}
        />
      </RoundedBox>

      {/* Brushed highlight panel */}
      <RoundedBox
        args={[3.28, 2.03, 0.02]}
        radius={0.1}
        smoothness={5}
        position={[0, 0, 0.045]}
      >
        <meshStandardMaterial
          color="#1c1c1c"
          metalness={1}
          roughness={0.35}
          envMapIntensity={1.1}
        />
      </RoundedBox>

      {/* EMV chip */}
      <RoundedBox
        args={[0.5, 0.4, 0.03]}
        radius={0.05}
        smoothness={4}
        position={[-1.0, 0.45, 0.07]}
      >
        <meshStandardMaterial
          color="#d6d6d6"
          metalness={1}
          roughness={0.15}
          envMapIntensity={1.6}
        />
      </RoundedBox>

      {/* Magnetic / contactless bars */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.35 + i * 0.14, 0.45, 0.075]}>
          <boxGeometry args={[0.03, 0.34, 0.02]} />
          <meshStandardMaterial
            color="#8c8c8c"
            metalness={0.9}
            roughness={0.25}
          />
        </mesh>
      ))}

      {/* Embossed number line */}
      <mesh position={[-0.55, -0.35, 0.075]}>
        <boxGeometry args={[2.1, 0.14, 0.02]} />
        <meshStandardMaterial color="#3d3d3d" metalness={0.85} roughness={0.4} />
      </mesh>

      {/* Small holo accent (kept greyscale) */}
      <mesh position={[1.05, -0.55, 0.075]}>
        <circleGeometry args={[0.26, 48]} />
        <meshStandardMaterial
          color="#fafafa"
          metalness={1}
          roughness={0.05}
          envMapIntensity={2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
