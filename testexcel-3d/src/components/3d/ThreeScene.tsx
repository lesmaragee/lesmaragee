import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import PaymentCard from './PaymentCard';
import WireframeTerrain from './WireframeTerrain';
import FloatingParticles from './FloatingParticles';

export default function ThreeScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0a0a0a']} />
        <fog attach="fog" args={['#0a0a0a', 8, 30]} />

        {/* Monochrome studio lighting */}
        <ambientLight intensity={0.25} />
        <pointLight position={[10, 10, 10]} intensity={1.4} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#d6d6d6" />
        <directionalLight position={[0, 5, 5]} intensity={1.6} color="#ffffff" />

        <Suspense fallback={null}>
          <Environment preset="city" />
          <PaymentCard />
          <FloatingParticles />
          <WireframeTerrain />
        </Suspense>
      </Canvas>

      {/* CSS vignette + inner shadow to blend edges */}
      <div
        className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(10,10,10,0.9)]"
        style={{
          background:
            'radial-gradient(circle at 65% 45%, rgba(255,255,255,0.05), transparent 55%)',
        }}
      />
    </div>
  );
}
