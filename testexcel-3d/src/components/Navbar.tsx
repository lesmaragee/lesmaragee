import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Menu, X } from 'lucide-react';

const LINKS = ['Services', 'Expertise', 'Resources', 'Founder', 'Contact'];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'py-4 bg-ink/60 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
          : 'py-8 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#top" className="flex items-center gap-3 group">
          <span className="relative">
            <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.75} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-sm bg-white/20 blur-[6px]" />
          </span>
          <span className="font-display font-bold text-lg tracking-[0.2em] text-white">
            TESTEXCEL
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-12">
          {LINKS.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-sm text-grey-400 hover:text-white transition-colors duration-200 font-mono uppercase tracking-wider"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <a
          href="#contact"
          className="hidden md:flex items-center gap-2.5 rounded-full border border-white/10 px-5 py-2.5 text-sm text-grey-200 hover:text-white hover:bg-white/5 transition-all duration-200 font-mono uppercase tracking-wider"
        >
          <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(250,250,250,0.8)]" />
          Talk to TestExcel
        </a>

        {/* Hamburger */}
        <button
          className="md:hidden text-white"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="md:hidden absolute top-full left-0 w-full bg-ink/95 backdrop-blur-md p-6 border-b border-white/10"
          >
            <div className="flex flex-col gap-5">
              {LINKS.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  onClick={() => setOpen(false)}
                  className="text-lg text-grey-200 hover:text-white transition-colors font-mono uppercase tracking-wider"
                >
                  {link}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="w-full text-center rounded-full border border-white/10 px-5 py-3 text-sm text-white hover:bg-white/5 transition-all font-mono uppercase tracking-wider"
              >
                Talk to TestExcel
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
