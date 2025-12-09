import client from "@/utils/client";
import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
const mainContractAdress = "0x779Af3e10B5a2af5513A7A964cFCbB9F31e4a56d";

export const mainContract = getContract({
  chain: sepolia,
  client: client,
  address: mainContractAdress as string,
});
