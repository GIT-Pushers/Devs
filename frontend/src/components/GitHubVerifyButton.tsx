'use client';

import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { useGitHubVerification } from '@/hooks/useGitHubVerification';

export default function GitHubVerifyButton() {
  const { initiateGitHubLogin } = useGitHubVerification();

  return (
    <Button
      onClick={initiateGitHubLogin}
      variant="default"
      className="w-full flex items-center gap-2"
    >
      <Github className="h-5 w-5" />
      Verify with GitHub
    </Button>
  );
}
