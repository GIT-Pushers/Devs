'use client';

import { useState } from 'react';
import { prepareContractCall, sendTransaction } from 'thirdweb';
import { useActiveAccount } from 'thirdweb/react';
import { mainContract } from '@/app/constants/contracts';
import type { TeamData } from '@/types/verification';

export function useTeamManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const account = useActiveAccount();

  const uploadMetadata = async (teamData: {
    teamName: string;
    teamDescription: string;
    teamImage?: File;
    members?: string[];
  }) => {
    const formData = new FormData();
    formData.append('teamName', teamData.teamName);
    formData.append('teamDescription', teamData.teamDescription);
    if (teamData.teamImage) {
      formData.append('teamImage', teamData.teamImage);
    }
    formData.append('members', JSON.stringify(teamData.members || []));

    const response = await fetch('/api/teams/metadata', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to upload metadata');
    }

    return await response.json();
  };

  const createTeam = async (teamData: TeamData) => {
    if (!account) {
      throw new Error('No wallet connected');
    }

    if (teamData.joinCode.length < 8) {
      throw new Error('Join code must be at least 8 characters');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Upload metadata to IPFS
      const { metadataUri } = await uploadMetadata(teamData);

      // Prepare contract call
      const transaction = prepareContractCall({
        contract: mainContract,
        method: 'function createTeam(string metadataURI, string joinCode) returns (uint256)',
        params: [metadataUri, teamData.joinCode],
      });

      // Send transaction
      const result = await sendTransaction({
        account,
        transaction,
      });

      return {
        success: true,
        transactionHash: result.transactionHash,
        metadataUri,
      };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const joinTeam = async (teamId: number, joinCode: string) => {
    if (!account) {
      throw new Error('No wallet connected');
    }

    if (joinCode.length < 8) {
      throw new Error('Join code must be at least 8 characters');
    }

    setIsLoading(true);
    setError(null);

    try {
      const transaction = prepareContractCall({
        contract: mainContract,
        method: 'function joinTeam(uint256 teamId, string joinCode)',
        params: [BigInt(teamId), joinCode],
      });

      const result = await sendTransaction({
        account,
        transaction,
      });

      return {
        success: true,
        transactionHash: result.transactionHash,
      };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createTeam,
    joinTeam,
    uploadMetadata,
    isLoading,
    error,
  };
}
