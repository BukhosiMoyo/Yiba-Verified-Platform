"use client";

import Link from "next/link";
import { ArrowRight, Shield, FileCheck, Users, Check, Building2, GraduationCap, Clock, TrendingUp, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GradientShell, DotGrid, Glow } from "@/components/shared/Backgrounds";
import { motion } from "framer-motion";

const HERO_UNDERLINE = (
    <span className="relative inline-block">
        <span className="relative z-10">ensure quality</span>
        <motion.span
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="absolute left-0 bottom-1 h-[0.2em] bg-gradient-to-r from-primary/60 to-primary/80 rounded-full"
            aria-hidden
        />
    </span>
);

const containerVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 50 }
    }
};

export function LandingPageContent() {
    return (
        <>
            {/* Hero */}
            <GradientShell as="section" className="py-20 sm:py-24 md:py-32 relative">
                <Glow position="top-right" className="opacity-60" />
                <Glow position="bottom-left" className="opacity-40" />

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <motion.div variants={itemVariants}>
                            <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-xs font-medium border-border/60 glass backdrop-blur-sm">
                                QCTO-ready • Verified compliance
                            </Badge>
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="text-[2.5rem] font-bold leading-[1.15] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-[3.5rem] drop-shadow-sm"
                        >
                            Streamline compliance, {HERO_UNDERLINE}
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto"
                        >
                            Yiba Verified empowers institutions to manage QCTO compliance
                            requirements with confidence. Track readiness, manage learners,
                            and maintain regulatory standards all in one platform.
                        </motion.p>

                        <motion.div
                            variants={itemVariants}
                            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <Button asChild size="lg" className="btn-primary-premium rounded-xl px-8 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                                <Link href="/contact">Request Demo</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="rounded-xl px-8 h-12 text-base font-medium border-2 border-border hover:bg-muted/60 hover:border-foreground/20 transition-all duration-200 glass">
                                <Link href="/how-it-works">Learn More</Link>
                            </Button>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground"
                        >
                            {[
                                { icon: FileCheck, text: "QCTO-aligned" },
                                { icon: Shield, text: "Secure & compliant" },
                                { icon: Users, text: "Built for institutions" }
                            ].map(({ icon: Icon, text }, i) => (
                                <span key={i} className="inline-flex items-center gap-2">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                                        <Icon className="h-4 w-4" strokeWidth={1.5} />
                                    </span>
                                    {text}
                                </span>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </GradientShell>

            {/* Stats Section */}
            <section className="py-16 sm:py-20 border-y border-border/60 bg-muted/30 relative">
                <DotGrid className="opacity-[0.05]" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, staggerChildren: 0.1 }}
                        className="grid grid-cols-2 gap-8 md:grid-cols-4"
                    >
                        {[
                            { icon: Building2, value: "50+", label: "Institutions Onboarded" },
                            { icon: GraduationCap, value: "10,000+", label: "Learners Tracked" },
                            { icon: Clock, value: "70%", label: "Faster Review Times" },
                            { icon: TrendingUp, value: "99.9%", label: "Platform Uptime" }
                        ].map(({ icon: Icon, value, label }, i) => (
                            <motion.div
                                key={i}
                                className="text-center group cursor-default"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <div className="flex items-center justify-center mb-3">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-zinc-800 text-primary shadow-[0_2px_10px_rgb(0,0,0,0.06)] group-hover:shadow-[0_8px_20px_rgb(37,99,235,0.15)] transition-all duration-300">
                                        <Icon className="h-7 w-7" strokeWidth={1.5} />
                                    </div>
                                </div>
                                <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{value}</p>
                                <p className="text-sm text-muted-foreground mt-1 font-medium">{label}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Feature grid */}
            <section className="py-24 sm:py-32 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mx-auto max-w-2xl text-center"
                    >
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            Everything you need for compliance
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Comprehensive tools designed for QCTO institutions, reviewers, and learners.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.1 } }
                        }}
                        className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3"
                    >
                        {[
                            { title: "Institutional Management", desc: "Complete oversight of institutional readiness, documentation, and compliance status.", icon: FileCheck },
                            { title: "QCTO Review & Approval", desc: "Streamlined review workflows for QCTO staff to evaluate and approve institutional submissions.", icon: Shield },
                            { title: "Learner Progress Tracking", desc: "Monitor learner progress, manage profiles, and maintain comprehensive records for compliance.", icon: Users },
                        ].map(({ title, desc, icon: Icon }) => (
                            <motion.div variants={itemVariants} key={title}>
                                <Card className="h-full group relative border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 hover:border-primary/20 dark:hover:border-primary/30 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <CardHeader>
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white shadow-sm">
                                            <Icon className="h-6 w-6" strokeWidth={1.5} />
                                        </div>
                                        <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">{title}</CardTitle>
                                        <CardDescription className="text-base leading-relaxed">{desc}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button asChild variant="link" className="p-0 text-primary font-medium group-hover:translate-x-1 transition-transform">
                                            <Link href="/features" className="inline-flex items-center">Learn more <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={1.5} aria-hidden /></Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 sm:py-32 border-t border-border/60 bg-muted/20 relative">
                <DotGrid className="opacity-[0.03]" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mx-auto max-w-2xl text-center mb-16"
                    >
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            Trusted by institutions across South Africa
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            See how Yiba Verified is transforming QCTO compliance.
                        </p>
                    </motion.div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {[
                            {
                                quote: "Yiba Verified has completely transformed how we manage our QCTO compliance. What used to take weeks now takes days.",
                                author: "Dr. Sarah Molefe",
                                role: "Quality Assurance Director",
                                org: "Technical Training College",
                            },
                            {
                                quote: "The platform gives us complete visibility into our readiness status. We can identify gaps before they become problems.",
                                author: "James van der Berg",
                                role: "Compliance Manager",
                                org: "Skills Development Centre",
                            },
                            {
                                quote: "As a QCTO reviewer, having all documentation in one place with proper audit trails makes my job significantly easier.",
                                author: "Nomvula Dlamini",
                                role: "QCTO Quality Reviewer",
                                org: "Quality Council for Trades and Occupations",
                            },
                        ].map((testimonial, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className="relative border-border/40 bg-card/80 backdrop-blur-sm h-full hover:shadow-md transition-shadow">
                                    <CardContent className="pt-8">
                                        <Quote className="h-10 w-10 text-primary/10 mb-4 absolute top-6 right-6" strokeWidth={1} />
                                        <p className="text-foreground/80 text-lg leading-relaxed mb-8 relative z-10 italic">
                                            &ldquo;{testimonial.quote}&rdquo;
                                        </p>
                                        <div className="border-t border-border/60 pt-4 mt-auto">
                                            <p className="font-semibold text-foreground">{testimonial.author}</p>
                                            <p className="text-sm text-primary font-medium">{testimonial.role}</p>
                                            <p className="text-sm text-muted-foreground">{testimonial.org}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Security / trust */}
            <section className="py-20 sm:py-24 border-t border-border/60 bg-background">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            Security & trust first
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Role-based access, audit trails, and compliance‑ready data handling.
                        </p>
                    </div>
                    <div className="mx-auto mt-12 flex flex-wrap justify-center gap-4">
                        {["Role-based access control", "Full audit trails", "Secure document storage", "QCTO-ready workflows"].map((item, i) => (
                            <motion.span
                                key={item}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-5 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted/50 transition-colors cursor-default"
                            >
                                <Check className="h-4 w-4 text-primary" strokeWidth={2} /> {item}
                            </motion.span>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative overflow-hidden py-24 sm:py-32 bg-muted/40 border-t border-border/60">
                <DotGrid className="opacity-[var(--pattern-opacity)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="mx-auto max-w-2xl text-center"
                    >
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-6">
                            Ready to get started?
                        </h2>
                        <p className="mb-10 text-xl text-muted-foreground">
                            Contact us today to schedule a demo and see how Yiba Verified can transform your compliance processes.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                            <Button asChild size="lg" className="btn-primary-premium rounded-xl px-10 h-14 text-lg font-semibold shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all">
                                <Link href="/contact">Get in Touch</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="rounded-xl px-10 h-14 text-lg font-medium border-2 border-border hover:bg-background hover:text-foreground hover:border-foreground/30 transition-all">
                                <Link href="/login">Sign In</Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>
        </>
    );
}
