"use client";

import React from "react";
import { ConnectButton, darkTheme, lightTheme } from "thirdweb/react";
import client from "@/utils/client";
import { useTheme } from "next-themes";

export function ConnectWalletButton() {
  const { theme } = useTheme();

  return (
    <ConnectButton
      theme={theme === "dark" ? darkTheme() : lightTheme()}
      client={client}
    />
  );
}
