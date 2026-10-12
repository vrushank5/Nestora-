import { motion } from 'framer-motion'
import NestoraLogo from './NestoraLogo.jsx'

function AppLoader({ message = 'Loading Nestora...' }) {
  return (
    <motion.section
      className="app-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Loading Nestora"
    >
      <motion.div
        className="loader-card"
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={{
            scale: [1, 1.015, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: 'easeInOut',
          }}
        >
          <NestoraLogo variant="loader" width="170px" />
        </motion.div>

        <div className="loader-indicator-group">
          <div className="loader-track" aria-hidden="true">
            <motion.span
              initial={{ x: '-120%' }}
              animate={{ x: '120%' }}
              transition={{ duration: 1.2, repeat: Infinity, ease: [0.76, 0, 0.24, 1] }}
            />
          </div>
          {message && <p className="loader-caption">{message}</p>}
        </div>
      </motion.div>
    </motion.section>
  )
}

export default AppLoader
