"use client";
import React, { useState } from 'react';
import { Key, CheckCircle2, ShieldCheck, AlertCircle, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { FileUploader } from './ui/fileupload';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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
      <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 shadow-xl shadow-primary/5 text-center max-w-lg mx-auto">
        <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/30">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-extrabold text-white mb-2">Team Created!</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-muted-foreground mb-8 text-lg">
            Your team has been successfully registered. You can now invite members using your secure join code.
          </p>

          <div className="bg-black/40 rounded-xl p-5 text-left space-y-4 mb-8 border-2 border-primary/20 backdrop-blur-sm">
             <div className="flex justify-between items-center">
               <span className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Team Name</span>
               <span className="text-sm font-bold text-white">{formData.name}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Status</span>
               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                 Active
               </span>
             </div>
          </div>

          <Button onClick={resetForm} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 text-base shadow-lg shadow-primary/30 border-2 border-primary/40">
            Create Another Team
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 shadow-xl shadow-primary/5 max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b-2 border-primary/30">
        <CardTitle className="flex items-center gap-3 text-white text-2xl">
          <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
            <Users className="w-6 h-6 text-primary" />
          </div>
          Create New Team
        </CardTitle>
        <p className="text-muted-foreground mt-2">Register your team profile for the HackX hackathon.</p>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Team Name
              </label>
              <Input 
                placeholder="e.g. The Code Warriors"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-black/40 border-2 border-primary/20 text-white placeholder:text-muted-foreground focus:border-primary/50"
              />
              {errors.name && <p className="text-destructive text-sm mt-2 font-medium">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Team Description
              </label>
              <Textarea
                placeholder="What is your team building? Describe your mission."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-black/40 border-2 border-primary/20 text-white placeholder:text-muted-foreground focus:border-primary/50 min-h-[100px]"
              />
              {errors.description && <p className="text-destructive text-sm mt-2 font-medium">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Team Image
              </label>
              <FileUploader 
                value={formData.image}
                onChange={(file) => setFormData(prev => ({ ...prev, image: file }))}
              />
              {errors.image && <p className="text-destructive text-sm mt-2 font-medium">{errors.image}</p>}
            </div>

            <Card className="bg-black/40 border-2 border-primary/20 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  <div className="p-1.5 bg-primary/20 rounded-lg border border-primary/30">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </div>
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Join Code
                  </label>
                  <Input 
                    type="password"
                    placeholder="••••••••"
                    value={formData.joinCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, joinCode: e.target.value }))}
                    className="bg-black/60 border-2 border-primary/20 text-white placeholder:text-muted-foreground focus:border-primary/50"
                  />
                  {errors.joinCode && <p className="text-destructive text-sm mt-2 font-medium">{errors.joinCode}</p>}
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
                  <Key className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>Members will use this code to join your team. It must be at least 8 characters.</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {status === 'error' && (
            <div className="p-4 bg-destructive/20 border-2 border-destructive/30 rounded-lg flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-medium">Something went wrong during creation. Please try again.</p>
            </div>
          )}

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 text-base shadow-lg shadow-primary/30 border-2 border-primary/40"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Creating Team...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};