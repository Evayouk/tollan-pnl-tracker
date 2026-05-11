export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { address, action } = req.query;
  const ALCHEMY = 'https://abstract-mainnet.g.alchemy.com/v2/qIG1PwQv9zTyyCproxF02';

  try {
    if (action === 'rewards') {
      // Fetch ALL transfers received by wallet, filter by rewards contract
      const body = {
        id: 1, jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x0',
          toBlock: 'latest',
          toAddress: address,
          category: ['external', 'internal'],
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
