"use client";
import React, { useState } from 'react';
import { Key, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'thirdweb/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { FileUploader } from './ui/fileupload';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import WalletConnectionButton from './WalletConnectionButton';

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
  const [txHash, setTxHash] = useState<string>('');
  
  const router = useRouter();
  const account = useActiveAccount();
  const { createTeam, isLoading, error: contractError } = useTeamManagement();

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) newErrors.name = 'Team name is required';
    if (formData.name.length < 3) newErrors.name = 'Team name must be at least 3 characters';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
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

    if (!account) {
      setErrors({ name: 'Please connect your wallet first' });
      return;
    }

    setStatus('submitting');
    
    try {
      const result = await createTeam({
        teamName: formData.name,
        teamDescription: formData.description,
        joinCode: formData.joinCode,
        teamImage: formData.image || undefined,
      });
      
      console.log('Team created:', result);
      setTxHash(result.transactionHash);
      setStatus('success');
    } catch (err: any) {
      console.error('Create team error:', err);
      setStatus('error');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', joinCode: '', image: null });
    setStatus('idle');
    setErrors({});
    setTxHash('');
    router.push('/home');
  };

  // Show wallet connection prompt if not connected
  if (!account) {
    return (
      <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-sm text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8 text-neutral-600" />
        </div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">Connect Your Wallet</h3>
        <p className="text-neutral-600 mb-8">
          You need to connect your wallet to create a team on the blockchain.
        </p>
        <WalletConnectionButton />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-sm text-center max-w-lg mx-auto animate-fadeIn">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">Team Created!</h3>
        <p className="text-neutral-600 mb-4">
          Your team has been successfully registered on the blockchain. You can now invite members using your secure join code.
        </p>

        <div className="bg-neutral-50 rounded-lg p-4 text-left space-y-3 mb-8 border border-neutral-100">
           <div className="flex justify-between items-center">
             <span className="text-sm font-medium text-neutral-500">Team Name</span>
             <span className="text-sm font-bold text-neutral-900">{formData.name}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-sm font-medium text-neutral-500">Status</span>
             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
               Active
             </span>
           </div>
           {txHash && (
             <div className="pt-2 border-t border-neutral-200">
               <span className="text-sm font-medium text-neutral-500 block mb-1">Transaction</span>
               <span className="text-xs font-mono text-neutral-700 break-all">
                 {txHash.slice(0, 10)}...{txHash.slice(-8)}
               </span>
             </div>
           )}
        </div>

        <Button onClick={resetForm} className="w-full">
          Go to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl border border-neutral-200 shadow-sm max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Create New Team</h2>
        <p className="text-neutral-500 mt-1">Register your team profile for the HackX hackathon on the blockchain.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">Team Name</label>
            <Input 
              placeholder="e.g. The Code Warriors"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={status === 'submitting'}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">Team Description</label>
            <Textarea
              placeholder="What is your team building? Describe your mission."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={status === 'submitting'}
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">Team Image</label>
            <FileUploader 
              value={formData.image}
              onChange={(file) => setFormData(prev => ({ ...prev, image: file }))}
              disabled={status === 'submitting'}
            />
            {errors.image && <p className="text-red-600 text-sm mt-1">{errors.image}</p>}
          </div>

          <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-neutral-900" />
              <h3 className="font-semibold text-neutral-900">Security</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">Join Code</label>
              <Input 
                type="password"
                placeholder="••••••••"
                value={formData.joinCode}
                onChange={(e) => setFormData(prev => ({ ...prev, joinCode: e.target.value }))}
                className="bg-white"
                disabled={status === 'submitting'}
              />
              {errors.joinCode && <p className="text-red-600 text-sm mt-1">{errors.joinCode}</p>}
            </div>
            <p className="text-xs text-neutral-500 mt-2 flex items-start gap-1">
              <Key className="w-3 h-3 mt-0.5 shrink-0" />
              Members will use this code to join your team. It must be at least 8 characters.
            </p>
          </div>
        </div>

        {(status === 'error' || contractError) && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{contractError || 'Something went wrong during creation. Please try again.'}</p>
          </div>
        )}

        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full h-12 text-lg"
            disabled={status === 'submitting' || isLoading}
          >
            {status === 'submitting' || isLoading ? 'Creating Team...' : 'Create Team'}
          </Button>
        </div>
      </form>
    </div>
  );
};