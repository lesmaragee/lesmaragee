import { motion, type Variants } from 'framer-motion';
import { ShieldCheck, ArrowRight } from 'lucide-react';

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15, delayChildren: 0.6 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

export default function HeroContent() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full lg:w-[45%] pt-32 lg:pt-0 text-center lg:text-left pointer-events-auto"
    >
      {/* Label */}
      <motion.div
        variants={item}
        className="flex items-center gap-2 justify-center lg:justify-start mb-6"
      >
        <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2} />
        <span className="text-xs tracking-[0.2em] uppercase text-grey-300 font-mono">
          Payments. Compliance. Confidence.
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        variants={item}
        className="font-display font-extrabold tracking-tight leading-[1.05] text-5xl md:text-6xl lg:text-[4.5rem]"
      >
        We Find What{' '}
        <span className="relative inline-block">
          <span className="relative z-10 bg-gradient-to-r from-white to-grey-500 bg-clip-text text-transparent">
            Breaks
          </span>
          <span
            aria-hidden
            className="absolute inset-0 z-0 blur-2xl opacity-40 bg-gradient-to-r from-white to-grey-400 bg-clip-text text-transparent mix-blend-screen"
          >
            Breaks
          </span>
        </span>{' '}
        Before Your Customers Do
      </motion.h1>

      {/* Paragraph */}
      <motion.p
        variants={item}
        className="mt-7 text-grey-400 text-lg md:text-xl font-light leading-relaxed max-w-xl mx-auto lg:mx-0"
      >
        Payments QA, Scheme Compliance, Test Automation, and Release Assurance
        for banks, fintechs, and payment providers. We test every step from
        checkout to settlement, so defects never reach production.
      </motion.p>

      {/* Buttons */}
      <motion.div
        variants={item}
        className="mt-10 flex flex-wrap gap-4 justify-center lg:justify-start"
      >
        <a
          href="#contact"
          className="group flex items-center gap-2 rounded-full bg-white text-ink px-7 py-3.5 font-mono text-sm uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 hover:bg-grey-200 shadow-[0_0_24px_rgba(250,250,250,0.15)] hover:shadow-[0_0_36px_rgba(250,250,250,0.28)]"
        >
          Talk to TestExcel
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </a>
        <a
          href="#services"
          className="group flex items-center gap-2 rounded-full bg-black/20 border border-white/10 px-7 py-3.5 font-mono text-sm uppercase tracking-wider text-grey-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/5 hover:text-white"
        >
          Explore Services
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </a>
      </motion.div>

      {/* Credibility line */}
      <motion.p
        variants={item}
        className="mt-8 text-xs tracking-[0.04em] text-grey-500 font-mono"
      >
        Trusted across payments, fintech, banking, and regulated industries.
      </motion.p>
    </motion.div>
  );
}
