"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function ParticleBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // Avoid hydration mismatch on random values

    // Configuration for large soft orbs - vivid colors for premium feel
    const orbs = [
        { width: 600, height: 600, top: "-20%", left: "-10%", color: "bg-blue-500/20 dark:bg-blue-600/20", delay: 0 },
        { width: 700, height: 700, top: "20%", right: "-20%", color: "bg-indigo-500/20 dark:bg-indigo-600/20", delay: 2 },
        { width: 500, height: 500, bottom: "-10%", left: "10%", color: "bg-sky-400/20 dark:bg-sky-600/20", delay: 1 },
        { width: 550, height: 550, bottom: "10%", right: "10%", color: "bg-purple-500/15 dark:bg-purple-600/20", delay: 3 },
        { width: 400, height: 400, top: "40%", left: "40%", color: "bg-violet-400/15 dark:bg-violet-500/20", delay: 1.5 },
    ];

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none bg-background">
            {/* Base gradient - Richer dark mode */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

            {/* Application of orbs with improved blur and blending */}
            {orbs.map((orb, i) => (
                <motion.div
                    key={i}
                    className={`absolute rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen ${orb.color}`}
                    style={{
                        width: orb.width,
                        height: orb.height,
                        top: orb.top,
                        left: orb.left,
                        right: orb.right,
                        bottom: orb.bottom,
                    }}
                    animate={{
                        y: [0, 50, 0],
                        x: [0, 30, 0],
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                        duration: 15 + i * 2,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: orb.delay,
                    }}
                />
            ))}

            {/* Overlay noise for texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] dark:opacity-[0.07] mix-blend-overlay" />
        </div>
    );
}
