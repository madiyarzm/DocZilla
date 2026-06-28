"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  ScrollText,
  Quote,
  Scale,
  TrendingUp,
  ShieldCheck,
} from "lucide-react"
import { ClauseLedgerDemo } from "@/components/clause-ledger"

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
}

export default function Landing() {
  return (
    <div className="dz-dark min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <HowItWorks />
      <Capabilities />
      <ClosingCta />
      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
            🦖
          </span>
          DocZilla
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#capabilities" className="hover:text-foreground transition-colors">Capabilities</a>
        </nav>
        <Link
          href="/app/compliance"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Launch app <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="dz-grid absolute inset-0" />
      <div className="dz-radial absolute inset-x-0 top-0 h-[480px]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
        <div>
          <motion.span
            {...fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            agentic compliance
          </motion.span>
          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-display mt-5 text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl"
          >
            The agent that reads
            <br />
            the <span className="text-primary">fine print.</span>
          </motion.h1>
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 max-w-lg text-lg text-muted-foreground"
          >
            Upload your policy and a contract. DocZilla audits every clause against
            it, flags what fails, suggests the rewrite, and re-checks — until it
            passes. Every answer cites its source.
          </motion.p>
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/app/compliance"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Run an audit <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground transition hover:bg-card"
            >
              See how it works
            </a>
          </motion.div>
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex items-center gap-6 font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
          >
            <span>PDF · DOCX · TXT</span>
            <span className="h-3 w-px bg-border" />
            <span>cited evidence</span>
            <span className="h-3 w-px bg-border" />
            <span>audit trail</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <ClauseLedgerDemo />
        </motion.div>
      </div>
    </section>
  )
}

const STEPS = [
  {
    n: "01",
    title: "Set the ground truth",
    body: "Upload the policy a contract must satisfy. The agent extracts a structured checklist of testable requirements, each with a severity.",
  },
  {
    n: "02",
    title: "Audit clause by clause",
    body: "It checks the contract against every requirement — Pass, Fail, or Ambiguous — and quotes the exact evidence (or names what's missing).",
  },
  {
    n: "03",
    title: "Fix and re-check",
    body: "For anything that fails, it drafts a rewrite, applies it, and runs the audit again — iterating until everything passes or you stop it.",
  },
]

function HowItWorks() {
  return (
    <section id="how" className="border-t border-border/70 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="the loop"
          title="An audit that doesn't stop at finding problems."
        />
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-background p-7"
            >
              <span className="font-mono text-sm text-primary">{s.n}</span>
              <h3 className="font-display mt-4 text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const CAPS = [
  { icon: ScrollText, title: "Agentic compliance", body: "Policy → checklist → clause-level verdicts → rewrites → re-check, with a timestamped audit trail." },
  { icon: Quote, title: "Source citations", body: "Every answer names its filename, section, clause, and page — or says it couldn't find a source." },
  { icon: Scale, title: "License compliance", body: "Point it at a package.json or requirements.txt; it resolves each license and flags SPDX conflicts." },
  { icon: TrendingUp, title: "Trending questions", body: "See what your team asks most, deduplicated by meaning, not just exact wording." },
]

function Capabilities() {
  return (
    <section id="capabilities" className="border-t border-border/70 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading eyebrow="capabilities" title="Built for the people who sign off." />
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {CAPS.map((c, i) => {
            const Icon = c.icon
            return (
              <motion.div
                key={c.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/50"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ClosingCta() {
  return (
    <section className="border-t border-border/70 py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.div {...fadeUp} className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </motion.div>
        <motion.h2 {...fadeUp} transition={{ duration: 0.5, delay: 0.05 }} className="font-display mt-6 text-4xl font-semibold tracking-tight">
          Prove it, don't promise it.
        </motion.h2>
        <motion.p {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Run your first audit in under a minute. No setup, no integrations.
        </motion.p>
        <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.15 }} className="mt-8">
          <Link
            href="/app/compliance"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Launch DocZilla <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border/70 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
        <span className="flex items-center gap-2">
          <span>🦖</span> DocZilla
        </span>
        <span className="font-mono text-[11px] uppercase tracking-widest">
          reasoning · upstage solar · local embeddings
        </span>
      </div>
    </footer>
  )
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <motion.span
        {...fadeUp}
        className="font-mono text-[11px] uppercase tracking-widest text-primary"
      >
        {eyebrow}
      </motion.span>
      <motion.h2
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        {title}
      </motion.h2>
    </div>
  )
}
