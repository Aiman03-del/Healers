import { Link } from "react-router-dom";
import { MainLayout } from "../components/layout";

const highlightItems = [
  {
    label: "Role",
    value: "Solo Full-Stack Developer at Growthly IT",
  },
  {
    label: "Stack Love",
    value: "MERN • NestJS • TypeScript • Tailwind • Framer Motion",
  },
  {
    label: "Mission",
    value: "Craft minimal, detail-obsessed, performance-first experiences",
  },
];

const timeline = [
  {
    title: "Curiosity sparked",
    description:
      "Late nights reverse-engineering how the web works turned into a lifelong pursuit of clean, purposeful interfaces.",
  },
  {
    title: "Self-taught foundations",
    description:
      "From raw HTML & CSS to modern React, I embraced patience and persistence to level up—without a formal CS degree.",
  },
  {
    title: "Creating Healers",
    description:
      "Healers is a one-person studio effort. Every animation, API, and playback detail is hand-built to feel timeless.",
  },
];

const services = [
  {
    name: "Experience-first engineering",
    copy: "Whether it's a streaming platform or a bakery dashboard, every pixel earns its place through clarity and purpose.",
  },
  {
    name: "End-to-end ownership",
    copy: "From information architecture to deployment, I stay embedded until the product resonates with users.",
  },
  {
    name: "Long-term partnership",
    copy: "Projects don't end at launch. I iterate with real feedback, performance metrics, and lived usage.",
  },
];

export default function About() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-[#121212] text-gray-200">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1db9540d] via-[#121212] to-[#121212]">
        <div className="absolute inset-0 pointer-events-none opacity-[0.08] bg-[radial-gradient(circle_at_top,_#1db954_0,_transparent_55%)]" />
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center md:py-20">
          <div className="md:w-6/12">
            <p className="mb-4 inline-block rounded-full border border-emerald-500/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/90">
              About the maker
            </p>
            <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Hi, I’m Aiman Uddin Siam — the solo developer behind Healers.
            </h1>
            <p className="mt-4 text-base text-gray-300 sm:text-lg">
              I build products where design, engineering, and emotion meet. Healers is more than a streaming platform: it’s a reflection of the patience,
              discipline, and story I’ve carried from Mirsarai, Chattogram to Growthly IT.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://ausiaam.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#1db954] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#18a648]"
              >
                Explore my portfolio
              </a>
              <Link
                to="/"
                className="rounded-full border border-white/20 px-6 py-2 text-sm font-semibold text-white transition hover:border-white/40"
              >
                Back to Healers
              </Link>
            </div>
          </div>
          <div className="md:w-5/12">
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 shadow-xl backdrop-blur">
              <p className="text-sm text-gray-400">
                “I started with pure curiosity — obsessing over how the web really works. Today, every flow I design is built to feel inevitable, simple,
                and alive. I don’t ship features I wouldn’t love to use myself.”
              </p>
              <div className="mt-6 grid gap-3">
                {highlightItems.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/5 bg-[#101010] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">A story rooted in patience and persistence</h2>
            <p className="text-gray-300">
              I didn’t arrive here through a traditional CS path. My journey is self-forged — fueled by late nights, broken builds, and the thrill of making
              digital spaces feel alive. From crafting animated interactions in React to scaling services with Node and NestJS, I stay hands-on in every layer.
            </p>
            <p className="text-gray-300">
              The same obsession powers Healers. Every playlist card, waveform, and playback loop reflects the disciplines I’ve practiced across other
              projects — from recipe apps (MasterChef) to delivery systems (ParcelEase) and financial dashboards (Mahi Bakery).
            </p>
          </div>
          <div className="space-y-6">
            <div className="grid gap-4">
              {timeline.map((item) => (
                <div key={item.title} className="rounded-3xl border border-white/5 bg-white/[0.03] p-5">
                  <h3 className="text-sm font-semibold text-emerald-300/90">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-300">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#101010] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/80">Philosophy</p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">How I work when it’s just me and the code</h2>
            </div>
            <p className="max-w-xl text-sm text-gray-400">
              Minimalism doesn’t mean less — it means purpose. Every module I ship is tuned for resilience, clarity, and long-term maintainability.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {services.map((service) => (
              <div key={service.name} className="rounded-3xl border border-white/5 bg-[#181818] p-6 shadow-lg">
                <h3 className="text-base font-semibold text-white">{service.name}</h3>
                <p className="mt-3 text-sm text-gray-400">{service.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Beyond code: the compass that guides this platform</h2>
            <p className="mt-4 text-sm text-gray-300">
              Healers is powered by the same beliefs I pour into client work:
            </p>
            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              <li>
                <span className="font-semibold text-white">Clarity over clutter:</span> Interfaces should disappear so listeners can stay in flow.
              </li>
              <li>
                <span className="font-semibold text-white">Performance as the baseline:</span> The stack is tuned for responsive, low-latency playback on
                every device.
              </li>
              <li>
                <span className="font-semibold text-white">Story-driven craft:</span> Every release is an entry in my personal timeline — a new reason to refine,
                learn, and grow.
              </li>
            </ul>
            <p className="mt-6 text-sm text-gray-300">
              If you’re curious about working together or want to collaborate on something meaningful, I’m one message away.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-emerald-500/10 bg-emerald-500/10 p-6">
              <h3 className="text-sm font-semibold text-emerald-200 uppercase tracking-[0.2em]">Let’s collaborate</h3>
              <p className="mt-2 text-lg font-semibold text-white">Have a project or idea you’d love to bring to life?</p>
              <p className="mt-3 text-sm text-emerald-100/80">
                Schedule a quick call or write to me directly — I’m always ready to build something unforgettable.
              </p>
              <div className="mt-5 space-y-2 text-sm">
                <p>
                  <span className="font-semibold text-white">Email:</span>{" "}
                  <a className="text-emerald-200 hover:text-emerald-100" href="mailto:ausiaam83@gmail.com">
                    ausiaam83@gmail.com
                  </a>
                </p>
                <p>
                  <span className="font-semibold text-white">Call:</span>{" "}
                  <a className="text-emerald-200 hover:text-emerald-100" href="tel:+8801538288739">
                    +880 1538-288739
                  </a>
                </p>
                <p className="text-emerald-200">Mirsarai, Chattogram • Bangladesh</p>
              </div>
            </div>
            <div className="rounded-3xl border border-white/5 bg-[#101010] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Featured projects</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-300">
                <li>
                  <span className="font-semibold text-white">Healers</span> — A new wave music streaming platform built solo, end-to-end.
                </li>
                <li>
                  <span className="font-semibold text-white">MasterChef</span> — Recipe sharing for food lovers with collaborative features.
                </li>
                <li>
                  <span className="font-semibold text-white">ParcelEase</span> — A delivery management system designed for clarity and control.
                </li>
                <li>
                  <span className="font-semibold text-white">Mahi Bakery Dashboard</span> — Expense & profit tracking for real businesses.
                </li>
              </ul>
              <a
                href="https://ausiaam.netlify.app/#projects"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 transition hover:text-emerald-100"
              >
                View more work →
              </a>
            </div>
          </div>
        </div>
      </section>
      </div>
    </MainLayout>
  );
}

