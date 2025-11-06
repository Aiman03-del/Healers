// src/components/Loading.jsx
import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#121212]">
      <motion.div
        className="inline-block"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div className="w-16 h-16 border-2 border-gray-600 border-t-white rounded-full"></div>
      </motion.div>
    </div>
  );
}

