"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function ParticleBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // Avoid hydration mismatch on random values

    // Configuration for 5-6 large soft orbs
    const orbs = [
        { width: 400, height: 400, top: "-10%", left: "-10%", color: "bg-blue-500/10", delay: 0 },
        { width: 500, height: 500, top: "20%", right: "-20%", color: "bg-indigo-500/10", delay: 2 },
        { width: 300, height: 300, bottom: "-5%", left: "20%", color: "bg-sky-400/10", delay: 1 },
        { width: 450, height: 450, bottom: "10%", right: "10%", color: "bg-purple-500/5", delay: 3 },
        { width: 250, height: 250, top: "40%", left: "50%", color: "bg-blue-300/5", delay: 1.5 },
    ];

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />

            {/* Floating Orbs */}
            {orbs.map((orb, i) => (
                <motion.div
                    key={i}
                    className={`absolute rounded-full blur-[80px] ${orb.color}`}
                    style={{
                        width: orb.width,
                        height: orb.height,
                        top: orb.top,
                        left: orb.left,
                        right: orb.right,
                        bottom: orb.bottom,
                    }}
                    animate={{
                        y: [0, 20, 0],
                        x: [0, 10, 0],
                        scale: [1, 1.05, 1],
                        opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                        duration: 10 + i * 2,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: orb.delay,
                    }}
                />
            ))}

            {/* Overlay noise/texture for premium feel (optional, keeps it clean for now) */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        </div>
    );
}
