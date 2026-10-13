import { motion } from 'framer-motion';
import HeroContent from './HeroContent';
import ThreeScene from './3d/ThreeScene';

export default function Hero() {
  return (
    <section
      id="top"
      className="relative w-full h-screen min-h-[800px] overflow-hidden bg-ink"
    >
      {/* Layer 1: 3D background */}
      <ThreeScene />

      {/* Layer 2: content overlay */}
      <div className="absolute inset-0 flex justify-center pointer-events-none">
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center">
          <HeroContent />
        </div>
      </div>

      {/* Layer 3: scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none">
        <div className="flex items-start justify-center w-6 h-10 rounded-full border border-white/15 pt-2">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-white shadow-glow"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <span className="text-[0.65rem] tracking-[0.2em] text-grey-500 uppercase font-mono">
          Scroll to Discover
        </span>
      </div>
    </section>
  );
}
