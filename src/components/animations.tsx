"use client"

import { motion } from "framer-motion"

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

export function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

export function ScaleIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay, type: "spring", stiffness: 300, damping: 20 }}
        >
            {children}
        </motion.div>
    )
}

export function SlideIn({ children, delay = 0, direction = "up", className }: { children: React.ReactNode; delay?: number; direction?: "up" | "down" | "left" | "right"; className?: string }) {
    const initial = {
        opacity: 0,
        x: direction === "left" ? -20 : direction === "right" ? 20 : 0,
        y: direction === "up" ? 20 : direction === "down" ? -20 : 0,
    }

    return (
        <motion.div
            initial={initial}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.4, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
