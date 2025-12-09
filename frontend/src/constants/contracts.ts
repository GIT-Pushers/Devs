import client from "@/utils/client";
import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";

const mainContractAddress = "0x1e483933e7e95Fbe51A579060b0F648Cd3f6ABc2";

export const mainContract = getContract({
  chain: sepolia,
  client: client,
  address: mainContractAddress,
});
