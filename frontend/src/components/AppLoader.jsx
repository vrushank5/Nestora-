import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

function AppLoader() {
  return (
    <motion.section
      className="app-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.32 }}
      aria-label="Loading Nestora"
    >
      <motion.div
        className="loader-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="loader-mark"><Sparkles size={28} /></span>
        <strong>NESTORA</strong>
        <p>PG & CO-LIVING</p>
        <div className="loader-track" aria-hidden="true">
          <motion.span
            initial={{ x: '-120%' }}
            animate={{ x: '120%' }}
            transition={{ duration: 1.1, repeat: Infinity, ease: [0.76, 0, 0.24, 1] }}
          />
        </div>
      </motion.div>
    </motion.section>
  )
}

export default AppLoader
