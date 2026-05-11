export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { address, action } = req.query;
  const ALCHEMY = 'https://abstract-mainnet.g.alchemy.com/v2/qIG1PwQv9zTyyCproxF02';
  const PUBLIC  = 'https://api.mainnet.abs.xyz';

  try {
    if (action === 'rewards') {
      const paddedAddr = '0x000000000000000000000000' + address.slice(2).toLowerCase();
      const body = {
        jsonrpc: '2.0', id: 1,
        method: 'eth_getLogs',
        params: [{
          fromBlock: '0x1',
          toBlock: 'latest',
          address: '0x3e3645a8f76c0436739b1cd6262d8b64afa90941',
          topics: [null, paddedAddr]
        }]
      };
      const r = await fetch(PUBLIC, {
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
