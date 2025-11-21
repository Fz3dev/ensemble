"use client"

import { motion, useAnimation, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { Trash2 } from "lucide-react"
import { ReactNode, useEffect } from "react"

interface SwipeableEventCardProps {
    children: ReactNode
    onDelete: () => void
    className?: string
}

export function SwipeableEventCard({ children, onDelete, className }: SwipeableEventCardProps) {
    const controls = useAnimation()
    const x = useMotionValue(0)

    // Transform x value to opacity/scale for the icon
    const iconOpacity = useTransform(x, [0, -50, -100], [0, 0.5, 1])
    const iconScale = useTransform(x, [0, -100], [0.5, 1.2])

    // Background color opacity based on drag
    const bgOpacity = useTransform(x, [0, -100], [0, 1])

    const handleDragEnd = async (event: any, info: PanInfo) => {
        const threshold = -150 // px to trigger delete (increased for safety)

        if (info.offset.x < threshold) {
            // Swiped enough to delete
            await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } })
            onDelete()
        } else {
            // Snap back
            controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } })
        }
    }

    return (
        <div className={`relative rounded-xl ${className}`}>
            {/* Background Layer (Trash Icon) */}
            <motion.div
                className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 rounded-xl z-0"
                style={{ opacity: bgOpacity }}
            >
                <motion.div style={{ opacity: iconOpacity, scale: iconScale }}>
                    <Trash2 className="text-white w-6 h-6" />
                </motion.div>
            </motion.div>

            {/* Foreground Layer (Card Content) */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -1000, right: 0 }} // Allow dragging left freely
                dragElastic={0.1} // Resistance
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ x, touchAction: "pan-y" }} // touchAction pan-y allows vertical scrolling while dragging
                className="relative z-10 bg-background rounded-xl"
                whileTap={{ cursor: "grabbing" }}
            >
                {children}
            </motion.div>
        </div>
    )
}
