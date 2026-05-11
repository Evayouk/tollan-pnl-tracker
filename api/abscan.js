export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { address, action } = req.query;
  const ALCHEMY   = 'https://abstract-mainnet.g.alchemy.com/v2/qIG1PwQv9zTyyCproxF02';
  const APIKEY    = 'SHMKKK45WQQ398P5IV8YAAF1WTNY6EZ67M';
  const ETHERSCAN = 'https://api.etherscan.io/v2/api';
  const DEPOSIT   = '0xa688a6a53a26b6f0702a9a518482151415be1ff7';
  const REWARDS   = '0x3e3645a8f76c0436739b1cd6262d8b64afa90941';

  try {
    if (action === 'rewards') {
      const url = `${ETHERSCAN}?chainid=2741&module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${APIKEY}`;
      const r = await fetch(url);
      const data = await r.json();
      const results = [];
      for (const tx of (data.result || [])) {
        if (tx.from?.toLowerCase() === REWARDS && parseInt(tx.value) > 0) {
          results.push({ value: parseInt(tx.value) / 1e18, timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(), hash: tx.hash });
        }
      }
      res.status(200).json({ result: results });

    } else if (action === 'sent') {
      // Fetch BOTH normal txs AND internal txs, look for deposits to Tollan
      const [r1, r2] = await Promise.all([
        fetch(`${ETHERSCAN}?chainid=2741&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${APIKEY}`),
        fetch(`${ETHERSCAN}?chainid=2741&module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${APIKEY}`)
      ]);
      const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
      const results = [];
      const seen = new Set();

      for (const tx of [...(d1.result || []), ...(d2.result || [])]) {
        const key = tx.hash + tx.value;
        if (seen.has(key)) continue;
        seen.add(key);
        if (tx.to?.toLowerCase() === DEPOSIT && parseInt(tx.value) >= 6900000000000000) {
          results.push({ value: parseInt(tx.value) / 1e18, timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(), hash: tx.hash });
        }
      }
      res.status(200).json({ result: results });

    } else {
      const body = {
        id: 1, jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{ fromBlock: '0x0', toBlock: 'latest', toAddress: address, category: ['external'], withMetadata: true, excludeZeroValue: true, maxCount: '0x3e8' }]
      };
      const r = await fetch(ALCHEMY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await r.json();
      res.status(200).json(data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
