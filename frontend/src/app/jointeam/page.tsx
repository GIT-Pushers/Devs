"use client"

import React, { useState } from "react"

type Team = {
  id: number
  name: string
  members: string[]
}

function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function JoinTeamForm({ onJoin }: { onJoin: (team: Team) => void }) {
  const [teamId, setTeamId] = useState<string>("")
  const [joinCode, setJoinCode] = useState<string>("")
  const [status, setStatus] = useState<{ state: "idle" | "loading" | "success" | "error"; message?: string }>({ state: "idle" })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ state: "idle" })

    if (!teamId.trim() || !joinCode.trim()) {
      setStatus({ state: "error", message: "Please fill both Team ID and Join Code." })
      return
    }

    const idNum = Number.parseInt(teamId, 10)
    if (Number.isNaN(idNum) || idNum <= 0) {
      setStatus({ state: "error", message: "Team ID must be a positive number." })
      return
    }

    // optimistic loading
    setStatus({ state: "loading", message: "Joining team…" })

    // fake API
    setTimeout(() => {
      // demo validation — accept any join code but show nice success
      const team: Team = { id: idNum, name: `Team ${idNum}`, members: ["you"] }
      setStatus({ state: "success", message: `Joined ${team.name}` })
      onJoin(team)
    }, 700)
}
    
return (
    <form onSubmit={submit} className="mt-6 p-6 rounded-2xl bg-[var(--card)] shadow-sm border border-[var(--border)] max-w-xl text-[var(--foreground)]">
      <div className="flex items-center gap-4">
          <a href="#" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--secondary)] flex items-center justify-center text-[var(--secondary-foreground)] text-lg font-bold shadow-md ring-1 ring-[var(--border)]">HX</div>
          </a>
        

        <div>
          <div className="text-lg font-semibold text-[var(--foreground)]">Join an existing team</div>
          <div className="text-sm text-[var(--muted-foreground)]">Have a team ID and join code? Enter them below to join instantly.</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col">
          <span className="text-xs font-medium text-[var(--muted-foreground)] mb-1">Team ID</span>
          <input
            inputMode="numeric"
            pattern="\d*"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="e.g. 101"
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            aria-label="Team ID"
            required
          />
        </label>

        <label className="flex flex-col">
          <span className="text-xs font-medium text-[var(--muted-foreground)] mb-1">Join Code</span>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter team code"
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            aria-label="Join Code"
            required
          />
        </label>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-3 btn-secondary font-medium"
          aria-live="polite"
        >
          {status.state === "loading" ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <span>Joining…</span>
            </>
          ) : (
              <span>Join Team</span>
            )}
        </button>

        
        <div className="ml-auto text-sm text-[var(--muted-foreground)]">
          <span className="inline-block align-middle">Demo code:</span>{" "}
          <code className="bg-[var(--muted)] px-2 py-0.5 rounded text-xs text-[var(--foreground)] ml-2">JOINME</code>
        </div>
      </div>

      {/* Status messages */}
      <div className="mt-4 min-h-[1.6rem]">
        {status.state === "error" && <div className="text-sm text-[var(--destructive)]">{status.message}</div>}
        {status.state === "success" && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-[var(--foreground)]">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent-foreground)]/10 text-[var(--accent-foreground)]">
              <IconCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="font-medium">{status.message}</div>
              <div className="text-xs text-[var(--muted-foreground)]">You can now view team projects and chat with members.</div>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}

export default function JoinTeamPage() {
  const [joined, setJoined] = useState<Team | null>(null)

  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--background)] to-[var(--card)] text-[var(--foreground)] p-8">
      <div className="max-w-4xl mx-auto">
        <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--secondary)] flex items-center justify-center text-[var(--secondary-foreground)] text-lg font-bold shadow-md ring-1 ring-[var(--border)]">HX</div>
            <span className="font-semibold text-[var(--foreground)]" >HackX</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--muted-foreground)]">
            <a href="#" className="hover:text-[var(--foreground)]">Home</a>
            <a href="#hackathons" className="hover:text-[var(--foreground)]">Discover</a>
            <a href="#about" className="hover:text-[var(--foreground)]">About</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button aria-label="Notifications" className="relative p-2 rounded-md hover:bg-[var(--muted)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--destructive)] rounded-full ring-2 ring-[var(--background)]" />
            </button>

            <button aria-label="Profile" className="w-9 h-9 rounded-full bg-[var(--muted)] flex items-center justify-center text-sm font-medium">
              <span>U</span>
            </button>

            <div className="md:hidden">
              <button aria-label="Open menu" className="px-3 py-2 border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]">Menu</button>
            </div>
          </div>
        </div>
      </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <JoinTeamForm
              onJoin={(team) => {
                setJoined(team)
                // could navigate or refresh team data here
              }}
            />
          </div>
            
          <aside className="lg:col-span-1 p-4.5">
            <div className="p-4 rounded-xl bg-card border border-[var(--border)] shadow-sm p-3">
              <h3 className="font-semibold text-foreground">Why join via code?</h3>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted-foreground)]">
                <li>• Join private teams without public links.</li>
                <li>• Keep member count validated by organizers.</li>
                <li>• Immediate access to team resources after joining.</li>
              </ul>
              <div className="mt-4">
                <div className="text-xs text-gray-500">Need help?</div>
                <a href="#" className="text-accent-foreground text-italic text-sm mt-2 inline-block hx-cta hx-cta--secondary hx-cta--sm">Contact support</a>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-card border border-[var(--border)] shadow-sm text-sm text-gray-700">
              <div className="font-semibold text-foreground">Joined Team</div>
              <div className="mt-2">
                {joined ? (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold">
                      {joined.name.split(" ").slice(-1)[0]}
                    </div>
                    <div>
                      <div className="font-medium">{joined.name}</div>
                      <div className="text-xs text-gray-500">Members: {joined.members.join(", ")}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No team joined yet</div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}