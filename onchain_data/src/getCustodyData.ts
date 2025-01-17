import { grabTerraCustodyData } from "./getTerraCustody";
import { grabSolanaCustodyData } from "./getSolanaCustody";
import { grabEvmCustodyData } from "./getEvmCustody";
import { MongoClient } from "mongodb";
interface Token {
  tokenAddress: string;
  name: string;
  decimals: number;
  symbol: string;
  balance: BigInt;
  qty: number;
  tokenPrice: number;
  tokenBalanceUSD: number;
}

interface CustodyInfo {
  _id: string;
  chainName: string;
  chainId: number;
  emitterAddress: string;
  custodyUSD: number;
  tokens: Token[];
}

async function updateTable(chainInfo, client: MongoClient) {
  const custodyList = chainInfo.balances;
  try {
    const totalCustodyUSD = custodyList
      .map((x) => x.tokenBalanceUSD)
      .reduce((partialSum, a) => partialSum + a, 0);
    console.log("totalCustodyUSD=", totalCustodyUSD);

    const database = client.db("onchain_data");
    // Specifying a Schema is optional, but it enables type hints on
    // finds and inserts
    const chainId = chainInfo.chain_id;
    const emitterAddress = chainInfo.emitter_address;
    const custody = database.collection<CustodyInfo>("custody");
    const result = await custody.updateOne(
      { _id: `${chainId}/${emitterAddress}` },
      {
        $set: {
          chainName: chainInfo.name,
          chainId: chainId,
          emitterAddress: emitterAddress,
          custodyUSD: totalCustodyUSD,
          tokens: custodyList,
          _id: `${chainId}/${emitterAddress}`,
        },
      },
      { upsert: true }
    );
    console.log(`A document was inserted with the _id: ${result.upsertedId}`);
  } catch (e) {
    console.log(encodeURIComponent);
  }
  return;
}

const useAllowListstr = process.env.allowlist || "false";

(async () => {
  const uri = process.env.MONGODB_URI;
  if (uri === "" || uri === undefined) {
    console.log("No mongodb uri supplied");
    return -1;
  }
  const client = new MongoClient(uri);

  const useAllowList = true ? useAllowListstr === "true" : false;

  const promises = [
    grabSolanaCustodyData("1", useAllowList),
    grabEvmCustodyData("2", useAllowList),
    grabTerraCustodyData("3", useAllowList),
    grabEvmCustodyData("4", useAllowList),
    grabEvmCustodyData("5", useAllowList),
    grabEvmCustodyData("6", useAllowList),
    grabEvmCustodyData("7", useAllowList),
    // grabAlgorandCustodyData("8", useAllowList),
    grabEvmCustodyData("9", useAllowList),
    grabEvmCustodyData("10", useAllowList),
    grabEvmCustodyData("11", useAllowList),
    grabEvmCustodyData("12", useAllowList),
    grabEvmCustodyData("13", useAllowList),
    grabEvmCustodyData("14", useAllowList),
    // grabNearustodyData("15", useAllowList),
    grabEvmCustodyData("16", useAllowList),
    grabTerraCustodyData("18", useAllowList),
    // grabTerraCustodyData("28", useAllowList),
  ];

  const output = await Promise.all(promises);
  // iterate through chains & insert into mongodb
  try {
    for (let i = 0; i < output.length; i++) {
      const data = output[i];
      await updateTable(data, client);
    }
  } catch (e) {
    console.log(e);
  } finally {
    await client.close();
  }
})();
