export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { address, action } = req.query;
  const ALCHEMY = 'https://abstract-mainnet.g.alchemy.com/v2/qIG1PwQv9zTyyCproxF02';
  const MORALIS_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjQ2NmI0ZWMzLTg1MzAtNDY0Yy1hMTllLWM3MDZkZWY3ZDhkNyIsIm9yZ0lkIjoiNTE1MTk3IiwidXNlcklkIjoiNTMwMTM5IiwidHlwZUlkIjoiYzY4ZWEyMGYtNzhhNy00ZmRhLThhYzYtOGUxYWExM2MwYmI2IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3Nzg0OTc3NTQsImV4cCI6NDkzNDI1Nzc1NH0.niDzizzjQyrXo5CgZiw1UKnG-DPYLZQ03A3QuUNxpvo';

  try {
    if (action === 'rewards') {
      // Moralis supports internal transactions!
      const url = `https://deep-index.moralis.io/api/v2.2/${address}/verbose?chain=0xab5&limit=100&order=DESC`;
      const r = await fetch(url, {
        headers: {
          'X-API-Key': MORALIS_KEY,
          'accept': 'application/json'
        }
      });
      const data = await r.json();
      
      // Filter internal transfers from rewards contract
      const REWARDS = '0x3e3645a8f76c0436739b1cd6262d8b64afa90941'.toLowerCase();
      const results = [];
      
      for (const tx of (data.result || [])) {
        for (const internal of (tx.internal_transactions || [])) {
          if (internal.from?.toLowerCase() === REWARDS &&
              internal.to?.toLowerCase() === address.toLowerCase() &&
              internal.value && internal.value !== '0') {
            results.push({
              value: parseInt(internal.value) / 1e18,
              timestamp: tx.block_timestamp,
              hash: tx.hash
            });
          }
        }
      }
      res.status(200).json({ result: results });

    } else {
      const body = {
        id: 1, jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x0',
          toBlock: 'latest',
          ...(action === 'sent' ? { fromAddress: address } : { toAddress: address }),
          category: ['external'],
          withMetadata: true,
          excludeZeroValue: true,
          maxCount: '0x3e8'
        }]
      };
      const r = await fetch(ALCHEMY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      res.status(200).json(data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
