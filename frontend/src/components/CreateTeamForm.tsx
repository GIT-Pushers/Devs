"use client";
import React, { useState } from 'react';
import { Key, CheckCircle2, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { FileUploader } from './ui/fileupload';

interface TeamFormData {
  name: string;
  description: string;
  joinCode: string;
  image: File | null;
}

export const CreateTeamForm: React.FC = () => {
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    joinCode: '',
    image: null,
  });

  const [showJoinCode, setShowJoinCode] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<keyof TeamFormData, string>>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) newErrors.name = 'Team name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.image) newErrors.image = 'Team image is required';
    if (!formData.joinCode) {
      newErrors.joinCode = 'Join code is required';
    } else if (formData.joinCode.length < 8) {
      newErrors.joinCode = 'Join code must be at least 8 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('submitting');

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 2000));

    setStatus('success');
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', joinCode: '', image: null });
    setStatus('idle');
    setErrors({});
  };

  if (status === 'success') {
    return (
      <div className="bg-background p-8 rounded-xl border border-border shadow-sm text-center max-w-lg mx-auto animate-fadeIn">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Team Created!</h3>
        <p className="text-muted-foreground mb-8">
          Your team has been successfully registered. You can now invite members using your secure join code.
        </p>

        <div className="bg-secondary rounded-lg p-4 text-left space-y-3 mb-8 border border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Team Name</span>
            <span className="text-sm font-bold text-foreground">{formData.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Status</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">
              Active
            </span>
          </div>
        </div>

        <Button onClick={resetForm} className="w-full">
          Create Another Team
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background p-6 md:p-10 rounded-2xl border border-border shadow-sm max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Create New Team</h2>
        <p className="text-muted-foreground mt-1">Register your team profile for the HackX hackathon.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Team Name</label>
            <Input
              placeholder="e.g. The Code Warriors"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Team Description</label>
            <Textarea
              placeholder="What is your team building? Describe your mission."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
            {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block bg-background text-sm font-medium text-foreground mb-2">Team Image</label>
            <FileUploader
              value={formData.image}
              onChange={(file) => setFormData(prev => ({ ...prev, image: file }))}
            />
            {errors.image && <p className="text-destructive text-sm mt-1">{errors.image}</p>}
          </div>

          <div className="bg-background p-6 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Security</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Join Code</label>
              <div className="relative">
                <Input
                  type={showJoinCode ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.joinCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, joinCode: e.target.value }))}
                  className="bg-background pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowJoinCode(!showJoinCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showJoinCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.joinCode && <p className="text-destructive text-sm mt-1">{errors.joinCode}</p>}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
              <Key className="w-3 h-3 mt-0.5 shrink-0" />
              Members will use this code to join your team. It must be at least 8 characters.
            </p>
          </div>
        </div>

        {
          status === 'error' && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>Something went wrong during creation. Please try again.</p>
            </div>
          )
        }

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? 'Creating Team...' : 'Create Team'}
          </Button>
        </div>
      </form >
    </div >
  );
};