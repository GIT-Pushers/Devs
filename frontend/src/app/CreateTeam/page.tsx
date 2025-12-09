import React from "react";
import { CreateTeamForm } from "@/components/CreateTeamForm";
import { Terminal, Disc } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-black flex flex-col font-sans">
      {/* Main Content */}
      <main className="grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Header */}
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-1.5 w-16 bg-gradient-to-r from-primary to-primary/50"></div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest">
                <Disc className="w-3 h-3 animate-spin" />
                <span>Season 4 Registration Open</span>
              </div>
              <div className="h-1.5 w-16 bg-gradient-to-r from-primary/50 to-primary"></div>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
              Assemble Your Squad
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create a team, invite members via the secure hash code, and deploy
              your project metadata directly to IPFS.
            </p>
          </div>

          <CreateTeamForm />

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground/60">
              By creating a team, you agree to the HackX Code of Conduct and
              Participation Rules.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card/50 border-t border-border/50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <Terminal className="w-5 h-5 text-primary" />
            <span className="font-bold">HackX</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} HackX Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
