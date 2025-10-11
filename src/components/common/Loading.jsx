// src/components/Loading.jsx
import { motion } from 'framer-motion';

export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-fuchsia-900 to-black">
      <div className="text-center">
        <motion.div
          className="inline-block"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full"></div>
        </motion.div>
        <p className="mt-4 text-purple-300 text-xl font-semibold">{message}</p>
      </div>
    </div>
  );
}

