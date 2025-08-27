'use client'

import { motion } from 'framer-motion'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'

interface AnimatedScrollButtonProps {
  targetId: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export default function AnimatedScrollButton({ 
  targetId, 
  children, 
  className = '', 
  onClick 
}: AnimatedScrollButtonProps) {
  const { scrollToElement } = useSmoothScroll()

  const handleClick = () => {
    scrollToElement(targetId)
    onClick?.()
  }

  return (
    <motion.button
      onClick={handleClick}
      className={className}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  )
}