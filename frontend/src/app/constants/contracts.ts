import client from "@/utils/client";
import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";

const mainContractAddress = "0x2564b56E6eFE30aD48343DE792DAD69BE1b2759F";

export const mainContract = getContract({
  chain: sepolia,
  client: client,
  address: mainContractAddress,
});
