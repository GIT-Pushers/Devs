'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useActiveAccount } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import WalletConnectionButton from '@/components/WalletConnectionButton';

const teamSchema = z.object({
  teamName: z.string().min(3, 'Team name must be at least 3 characters'),
  teamDescription: z.string().min(10, 'Description must be at least 10 characters'),
  joinCode: z.string().min(8, 'Join code must be at least 8 characters'),
  teamImage: z.any().optional(),
});

type TeamForm = z.infer<typeof teamSchema>;

export default function CreateTeamPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [teamImage, setTeamImage] = useState<File | undefined>();
  const router = useRouter();
  const account = useActiveAccount();
  const { createTeam, isLoading, error } = useTeamManagement();

  const { register, handleSubmit, formState: { errors } } = useForm<TeamForm>({
    resolver: zodResolver(teamSchema),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTeamImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: TeamForm) => {
    try {
      const result = await createTeam({
        ...data,
        teamImage,
      });
      console.log('Team created:', result);
      alert('Team created successfully! Transaction: ' + result.transactionHash);
      router.push('/home');
    } catch (err: any) {
      console.error('Create team error:', err);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Create Your Team</h1>
          <WalletConnectionButton />
        </div>

        {!account ? (
          <div className="p-8 border rounded-lg bg-card text-center">
            <p className="text-lg mb-4">Please connect your wallet to create a team</p>
            <WalletConnectionButton />
          </div>
        ) : (
          <div className="p-6 border rounded-lg bg-card">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="teamName">Team Name *</Label>
              <Input
                id="teamName"
                {...register('teamName')}
                placeholder="Enter team name"
                className="mt-2"
              />
              {errors.teamName && (
                <p className="text-red-500 text-sm mt-1">{errors.teamName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="teamDescription">Description *</Label>
              <textarea
                id="teamDescription"
                {...register('teamDescription')}
                placeholder="Describe your team..."
                className="w-full min-h-[100px] p-2 border rounded-md mt-2 bg-background"
              />
              {errors.teamDescription && (
                <p className="text-red-500 text-sm mt-1">{errors.teamDescription.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="joinCode">Join Code * (min 8 characters)</Label>
              <Input
                id="joinCode"
                type="password"
                {...register('joinCode')}
                placeholder="Create a secret join code"
                className="mt-2"
              />
              {errors.joinCode && (
                <p className="text-red-500 text-sm mt-1">{errors.joinCode.message}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Share this code with teammates to let them join (keep it secret!)
              </p>
            </div>

            <div>
              <Label htmlFor="teamImage">Team Image (optional)</Label>
              <Input
                id="teamImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-2"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mt-4 w-32 h-32 object-cover rounded-lg border"
                />
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Creating Team...' : 'Create Team'}
            </Button>
          </form>
        </div>
        )}
      </div>
    </div>
  );
}
