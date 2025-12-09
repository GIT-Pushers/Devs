import React from "react";
// Update the import path if the file is located elsewhere, for example:
import { CreateTeamForm } from "@/components/CreateTeamForm";
// Or create the file at ../components/CreateTeamForm.tsx if it doesn't exist.
import { Terminal, Disc, Menu } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}

      {/* Main Content */}
      <main className="grow container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb-ish / Header area */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium mb-4">
              <Disc className="w-3 h-3 animate-spin-slow" />
              <span>Season 4 Registration Open</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
              Assemble Your Squad
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-foreground">
            <Terminal className="w-5 h-5" />
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
