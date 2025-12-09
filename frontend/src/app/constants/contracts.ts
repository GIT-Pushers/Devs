import client from "@/utils/client";
import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";

// Contract addresses
const mainContractAdress = "0x1e483933e7e95Fbe51A579060b0F648Cd3f6ABc2";
const githubVerifierAddress = "0x62F7448dd19DF9059B55F4fE670c41021D002fEf";

export const mainContract = getContract({
  chain: sepolia,
  client: client,
  address: mainContractAdress as string,
});

export const githubVerifierContract = getContract({
  chain: sepolia,
  client: client,
  address: githubVerifierAddress as string,
});
