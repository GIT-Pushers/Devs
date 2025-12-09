'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import WalletConnectionButton from '@/components/WalletConnectionButton';

export default function JoinTeamPage() {
  const [teamId, setTeamId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const router = useRouter();
  const account = useActiveAccount();
  const { joinTeam, isLoading, error } = useTeamManagement();

  const handleJoin = async () => {
    try {
      const result = await joinTeam(parseInt(teamId), joinCode);
      console.log('Joined team:', result);
      alert('Successfully joined team! Transaction: ' + result.transactionHash);
      router.push('/home');
    } catch (err: any) {
      console.error('Join team error:', err);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Join a Team</h1>
          <WalletConnectionButton />
        </div>

        {!account ? (
          <div className="p-8 border rounded-lg bg-card text-center">
            <p className="text-lg mb-4">Please connect your wallet to join a team</p>
            <WalletConnectionButton />
          </div>
        ) : (
          <div className="p-6 border rounded-lg bg-card">
            <div className="space-y-4">
            <div>
              <Label htmlFor="teamId">Team ID</Label>
              <Input
                id="teamId"
                type="number"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="Enter team ID (e.g., 0, 1, 2...)"
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Ask your team leader for the team ID
              </p>
            </div>

            <div>
              <Label htmlFor="joinCode">Join Code</Label>
              <Input
                id="joinCode"
                type="password"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter join code"
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Must be at least 8 characters
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}

            <Button 
              onClick={handleJoin} 
              disabled={isLoading || !teamId || joinCode.length < 8}
              className="w-full"
            >
              {isLoading ? 'Joining...' : 'Join Team'}
            </Button>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Don't have a team yet?
              </p>
              <Button 
                variant="outline" 
                onClick={() => router.push('/teams/create')}
                className="w-full"
              >
                Create Your Own Team
              </Button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
