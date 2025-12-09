"use client";

import React, { useMemo, useState } from "react";
import { mainContract } from "../constants/contracts";
import UserProfile from "@/components/UserProfile";

type Hack = {
  id: string;
  title: string;
  dates: string;
  startDate: string;
  endDate: string;
  desc: string;
  tags: string[];
  register: { type: string; href: string }[];
  featured: boolean;
  location: string;
};

const sampleHackathons: Hack[] = [
  {
    id: "h1",
    title: "InnovateCode 2025",
    dates: "Dec 20 — Dec 22, 2025",
    startDate: "2025-12-20",
    endDate: "2025-12-22",
    desc: "A weekend of rapid prototyping and open-source showcases.",
    tags: ["open-source", "web"],
    register: [
      { type: "GitHub", href: "#" },
      { type: "Google Form", href: "#" },
    ],
    featured: true,
    location: "Online",
  },
  {
    id: "h2",
    title: "Web3 Builders Jam",
    dates: "Jan 10 — Jan 12, 2026",
    startDate: "2026-01-10",
    endDate: "2026-01-12",
    desc: "Build blockchain-integrated apps and demos.",
    tags: ["blockchain", "eth"],
    register: [
      { type: "Repo Link", href: "#" },
      { type: "Direct Upload", href: "#" },
    ],
    featured: false,
    location: "Hybrid",
  },
  {
    id: "h3",
    title: "AI for Good Sprint",
    dates: "Feb 7 — Feb 9, 2026",
    startDate: "2026-02-07",
    endDate: "2026-02-09",
    desc: "Show how AI can make an impact — projects welcome.",
    tags: ["ai", "social-impact"],
    register: [
      { type: "GitHub", href: "#" },
      { type: "Slack Signup", href: "#" },
    ],
    featured: false,
    location: "Online",
  },
];

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-1 text-xs font-medium rounded-full border border-[var(--border)] bg-[var(--muted)]">
      {children}
    </span>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M21 21l-4.35-4.35"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="11"
        cy="11"
        r="6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [sort, setSort] = useState<"upcoming" | "newest" | "featured">(
    "upcoming"
  );

  const tags = useMemo(() => {
    const s = new Set(sampleHackathons.flatMap((h) => h.tags));
    return ["All", ...Array.from(s)];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = sampleHackathons.filter((h) => {
      if (onlyFeatured && !h.featured) return false;
      if (tag !== "All" && !h.tags.includes(tag)) return false;
      if (!q) return true;
      return [h.title, h.desc, h.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    if (sort === "upcoming") {
      list.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    } else if (sort === "newest") {
      list.sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
    } else if (sort === "featured") {
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return list;
  }, [query, tag, onlyFeatured, sort]);
  console.log(mainContract);
  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--background)] to-[var(--card)] text-[var(--foreground)] antialiased">
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--secondary)] flex items-center justify-center text-[var(--secondary-foreground)] text-lg font-bold shadow-md ring-1 ring-[var(--border)]">
              HX
            </div>
            <span className="font-semibold">HackX</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--muted-foreground)]">
            <a href="#" className="hover:text-[var(--foreground)]">
              Home
            </a>
            <a href="#hackathons" className="hover:text-[var(--foreground)]">
              Discover
            </a>
            <a href="#about" className="hover:text-[var(--foreground)]">
              About
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <UserProfile />

            <div className="md:hidden">
              <button
                aria-label="Open menu"
                className="px-3 py-2 border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-6 py-8">
        {/* Top-centered search bar */}
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <div className="flex items-center gap-3 border border-[var(--border)] rounded-full px-4 py-2 shadow-sm bg-[var(--background)]">
              <IconSearch />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events, tags, descriptions..."
                className="flex-1 outline-none text-sm bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                aria-label="Search hackathons"
              />
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="border-l border-[var(--border)] pl-3 text-sm bg-[var(--background)] text-[var(--foreground)]"
              >
                {tags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="grid grid-cols-1 gap-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Find hackathons, join communities, ship projects.
              </h1>
              <p className="mt-4 text-[var(--muted-foreground)] max-w-2xl">
                HackX is a curated home for hackathons and developer communities
                — discover upcoming events, submit repos for automated checks,
                and connect with mentors.
              </p>

              <div className="mt-6 flex gap-3 flex-wrap">
                <a
                  href="#hackathons"
                  className="inline-flex items-center gap-2 px-5 py-3 btn-primary font-medium"
                >
                  Explore Hackathons
                </a>
                <a
                  href="#community"
                  className="inline-flex items-center gap-2 px-5 py-3 btn-secondary font-medium"
                >
                  Community
                </a>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card
                  title="Automated Checks"
                  desc="Commit history, contributor checks and plagiarism scanning."
                />
                <Card
                  title="Mentors & Prizes"
                  desc="Find mentors and prize tracks tailored to your tech stack."
                />
                <Card
                  title="Community"
                  desc="Active Discords, Meetups and open office hours."
                />
              </div>
            </div>
          </div>
        </div>

        <div id="hackathons" className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Upcoming Hackathons</h2>
            <div className="text-sm text-[var(--muted-foreground)]">
              Curated — updated weekly
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((h) => (
              <EventCard key={h.id} h={h} />
            ))}
          </div>
        </div>

        <footer className="mt-16 border-t border-[var(--border)] pt-8 pb-12 text-sm text-[var(--muted-foreground)]">
          <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>© {new Date().getFullYear()} HackX — Built for builders.</div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-[var(--foreground)]">
                Privacy
              </a>
              <a href="#" className="hover:text-[var(--foreground)]">
                Terms
              </a>
              <a href="#" className="hover:text-[var(--foreground)]">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--card)]">
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{desc}</p>
    </div>
  );
}

function MiniCard({ h }: { h: Hack }) {
  return (
    <div className="mt-3 p-3 border border-[var(--border)] rounded-xl flex items-start gap-3 bg-[var(--card)]">
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{h.title}</div>
          <div className="text-xs text-[var(--muted-foreground)]">{h.dates}</div>
        </div>
        <div className="text-xs text-[var(--muted-foreground)] mt-1">{h.desc}</div>
      </div>
    </div>
  );
}

function EventCard({ h }: { h: Hack }) {
  return (
    <article className="p-6 border border-[var(--border)] rounded-xl bg-[var(--card)] shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{h.title}</h3>
          <div className="text-sm text-[var(--muted-foreground)]">
            {h.dates} · {h.location}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {h.featured && <Badge>Featured</Badge>}
          <div className="text-xs text-[var(--muted-foreground)]">{h.tags.join(", ")}</div>
        </div>
      </div>

      <p className="mt-3 text-[var(--muted-foreground)]">{h.desc}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {h.register.map((r, idx) => (
          <a
            key={idx}
            href={r.href}
            className="px-3 py-2 border border-[var(--border)] rounded-md text-sm transition btn-secondary"
          >
            Register ({r.type})
          </a>
        ))}
      </div>
    </article>
  );
}

function CommunityCard({
  name,
  members,
  activity,
}: {
  name: string;
  members: number;
  activity: string;
}) {
  return (
    <div className="p-4 border border-[var(--border)] rounded-xl bg-[var(--card)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-[var(--muted-foreground)]">
            {activity} · {members.toLocaleString()} members
          </div>
        </div>
        <div className="text-sm">
          <a href="#" className="px-3 py-1 border border-[var(--border)] rounded">
            Join
          </a>
        </div>
      </div>
    </div>
  );
}
