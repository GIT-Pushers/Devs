"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useActiveAccount } from "thirdweb/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Key, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react"
import { useTeamManagement } from "@/hooks/useTeamManagement"
import WalletConnectionButton from "@/components/WalletConnectionButton"

type Team = {
  id: number
  name: string
  members: string[]
  txHash?: string
}

function JoinTeamForm({ onJoin }: { onJoin: (team: Team) => void }) {
  const [teamId, setTeamId] = useState<string>("")
  const [joinCode, setJoinCode] = useState<string>("")
  const [status, setStatus] = useState<{ state: "idle" | "loading" | "success" | "error"; message?: string }>({ state: "idle" })
  
  const router = useRouter()
  const account = useActiveAccount()
  const { joinTeam, isLoading, error: contractError } = useTeamManagement()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ state: "idle" })

    if (!account) {
      setStatus({ state: "error", message: "Please connect your wallet first" })
      return
    }

    if (!teamId.trim() || !joinCode.trim()) {
      setStatus({ state: "error", message: "Please fill both Team ID and Join Code." })
      return
    }

    const idNum = Number.parseInt(teamId, 10)
    if (Number.isNaN(idNum) || idNum <= 0) {
      setStatus({ state: "error", message: "Team ID must be a positive number." })
      return
    }

    if (joinCode.length < 8) {
      setStatus({ state: "error", message: "Join code must be at least 8 characters." })
      return
    }

    setStatus({ state: "loading", message: "Joining team on blockchain…" })

    try {
      const result = await joinTeam(idNum, joinCode)
      console.log('Joined team:', result)
      
      const team: Team = { 
        id: idNum, 
        name: `Team ${idNum}`, 
        members: [account.address],
        txHash: result.transactionHash
      }
      
      setStatus({ state: "success", message: `Successfully joined Team ${idNum}!` })
      onJoin(team)
    } catch (err: any) {
      console.error('Join team error:', err)
      
      // Handle specific contract errors
      let errorMessage = "Failed to join team. Please check your Team ID and Join Code."
      
      if (err.message?.includes("Already a member")) {
        errorMessage = "You are already a member of this team!"
      } else if (err.message?.includes("Invalid join code")) {
        errorMessage = "Invalid join code. Please check and try again."
      } else if (err.message?.includes("Team does not exist")) {
        errorMessage = "Team not found. Please check the Team ID."
      } else if (err.message?.includes("Team is full")) {
        errorMessage = "This team is full and cannot accept new members."
      } else if (err.message) {
        // Extract readable error from contract error message
        const match = err.message.match(/Error - (.+?)(?:\n|$|contract:)/)
        if (match) {
          errorMessage = match[1].trim()
        }
      }
      
      setStatus({ state: "error", message: errorMessage })
    }
  }
  
  // Show wallet connection prompt if not connected
  if (!account) {
    return (
      <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 shadow-xl shadow-primary/5 max-w-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/30">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-white text-center">Connect Your Wallet</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-6">
            You need to connect your wallet to join a team on the blockchain.
          </p>
          <WalletConnectionButton />
        </CardContent>
      </Card>
    )
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
        <p className="text-muted-foreground mt-2 text-sm">Have a team ID and join code? Enter them below to join on the blockchain.</p>
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
                placeholder="e.g. 1"
                className="bg-black/40 border-2 border-primary/20 text-white placeholder:text-muted-foreground focus:border-primary/50"
                aria-label="Team ID"
                disabled={status.state === "loading" || isLoading}
                required
              />
            </label>

            <label className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Join Code</span>
              <Input
                type="password"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="8+ characters"
                className="bg-black/40 border-2 border-primary/20 text-white placeholder:text-muted-foreground focus:border-primary/50"
                aria-label="Join Code"
                disabled={status.state === "loading" || isLoading}
                required
              />
            </label>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/30 border-2 border-primary/40"
              disabled={status.state === "loading" || isLoading}
              aria-live="polite"
            >
              {status.state === "loading" || isLoading ? (
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
          </div>

          {/* Status messages */}
          <div className="min-h-[1.6rem]">
            {(status.state === "error" || contractError) && (
              <div className="flex items-center gap-3 p-3 bg-destructive/20 border border-destructive/30 rounded-lg text-destructive">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{status.message || contractError}</p>
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