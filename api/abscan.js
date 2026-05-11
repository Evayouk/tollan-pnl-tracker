export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { address, action } = req.query;
  const RPC = 'https://abstract-mainnet.g.alchemy.com/v2/qIG1PwQv9zTyyCproxF02';

  try {
    let body;

    if (action === 'rewards') {
      // Fetch transfers FROM rewards contract TO wallet
      body = {
        id: 1, jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x0',
          toBlock: 'latest',
          fromAddress: '0x3e3645a8f76c0436739b1cd6262d8b64afa90941',
          toAddress: address,
          category: ['external'],
          withMetadata: true,
          excludeZeroValue: true,
          maxCount: '0x3e8'
        }]
      };
    } else {
      body = {
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
    }

    const response = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
