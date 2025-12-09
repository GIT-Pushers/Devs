"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Key, CheckCircle2 } from "lucide-react"

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
    <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 shadow-xl shadow-primary/5 max-w-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
        <CardTitle className="flex items-center gap-3 text-white text-xl">
          <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
            <Users className="w-6 h-6 text-primary" />
          </div>
          Join an existing team
        </CardTitle>
        <p className="text-muted-foreground mt-2 text-sm">Have a team ID and join code? Enter them below to join instantly.</p>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Team ID</span>
              <Input
                inputMode="numeric"
                pattern="\d*"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="e.g. 101"
                className="bg-black/40 border-2 border-primary/20 text-white placeholder:text-muted-foreground focus:border-primary/50"
                aria-label="Team ID"
                required
              />
            </label>

            <label className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Join Code</span>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter team code"
                className="bg-black/40 border-2 border-primary/20 text-white placeholder:text-muted-foreground focus:border-primary/50"
                aria-label="Join Code"
                required
              />
            </label>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/30 border-2 border-primary/40 cursor-pointer"
              aria-live="polite"
            >
              {status.state === "loading" ? (
                <>
                  <svg className="w-4 h-4 animate-spin mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span>Joining…</span>
                </>
              ) : (
                <span>Join Team</span>
              )}
            </Button>

            <div className="ml-auto text-sm text-muted-foreground">
              <span className="inline-block align-middle">Demo code:</span>{" "}
              <code className="bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded text-xs font-mono ml-2">JOINME</code>
            </div>
          </div>

          {/* Status messages */}
          <div className="min-h-[1.6rem]">
            {status.state === "error" && (
              <div className="text-sm text-destructive font-medium p-3 bg-destructive/20 border border-destructive/30 rounded-lg">
                {status.message}
              </div>
            )}
            {status.state === "success" && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/20 border-2 border-primary/30">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/30 text-primary">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <div>
                  <div className="font-bold text-white">{status.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">You can now view team projects and chat with members.</div>
                </div>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function JoinTeamPage() {
  const [joined, setJoined] = useState<Team | null>(null)

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl overflow-hidden">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1.5 w-16 bg-gradient-to-r from-primary to-primary/50"></div>
            <span className="text-primary text-sm font-bold uppercase tracking-widest">
              Join Team
            </span>
            <div className="h-1.5 w-16 bg-gradient-to-r from-primary/50 to-primary"></div>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4">
            Join a Team
          </h1>
          <p className="text-xl text-muted-foreground">
            Enter your team ID and join code to become part of a hackathon team
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <JoinTeamForm
              onJoin={(team) => {
                setJoined(team)
                // could navigate or refresh team data here
              }}
            />
          </div>
            
          <aside className="lg:col-span-1 space-y-6 overflow-hidden">
            <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 shadow-xl shadow-primary/5 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
                <CardTitle className="text-white">Why join via code?</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Key className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Join private teams without public links.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Key className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Keep member count validated by organizers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Key className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Immediate access to team resources after joining.</span>
                  </li>
                </ul>
                <div className="mt-6 pt-4 border-t border-primary/20">
                  <div className="text-xs text-muted-foreground mb-2">Need help?</div>
                  <a href="#" className="text-primary text-sm font-medium hover:text-primary/80">Contact support</a>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 shadow-xl shadow-primary/5 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
                <CardTitle className="text-white">Joined Team</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {joined ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/30 text-primary flex items-center justify-center font-bold text-lg">
                      {joined.name.split(" ").slice(-1)[0][0]}
                    </div>
                    <div>
                      <div className="font-bold text-white">{joined.name}</div>
                      <div className="text-xs text-muted-foreground">Members: {joined.members.join(", ")}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No team joined yet</div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  )
}