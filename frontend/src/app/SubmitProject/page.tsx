import React from 'react';
import { Terminal, Menu, Disc, Code2 } from 'lucide-react';
import { ProjectSubmissionForm } from '@/components/ProjectSubmissionForm';

export default function SubmitProjectPage() {
    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
            {/* Header (Reused Layout) */}
            <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-neutral-200">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-black text-white p-1.5 rounded-lg">
                            <Terminal className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">HackX</span>
                    </div>

                    <div className="flex items-center gap-4">
                    
                        <button className="md:hidden p-2 text-neutral-600">
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
                <div className="max-w-4xl mx-auto">
                    {/* Header area */}
                    <div className="mb-10 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/50 text-indigo-600 text-xs font-medium mb-4">
                            <Code2 className="w-3 h-3" />
                            <span>Submissions Open</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 tracking-tight mb-4">
                            Ship Your Project
                        </h1>
                        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                            Ready to showcase your work? Enter your repository details below.
                            Our AI Auditor will analyze your code quality and generate an on-chain verification report.
                        </p>
                    </div>

                    <ProjectSubmissionForm />

                    <div className="mt-12 text-center text-sm text-neutral-400 max-w-lg mx-auto">
                        <p>
                            Ensure your repository is public. The AI analysis engine checks for best practices, security vulnerabilities, and code complexity.
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-neutral-200 py-12">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-neutral-900">
                        <Terminal className="w-5 h-5" />
                        <span className="font-bold">HackX</span>
                    </div>
                    <div className="text-sm text-neutral-500">
                        © {new Date().getFullYear()} HackX Platform. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
