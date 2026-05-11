export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { address, action } = req.query;
  const ALCHEMY = 'https://abstract-mainnet.g.alchemy.com/v2/qIG1PwQv9zTyyCproxF02';
  const PUBLIC  = 'https://api.mainnet.abs.xyz';

  try {
    if (action === 'rewards') {
      // Get all txs FROM the rewards contract caller
      const body = {
        id: 1, jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x0',
          toBlock: 'latest',
          fromAddress: '0xf2237f068009a5fc0431c37e7e49debfbb56ff32',
          toAddress: '0x3e3645a8f76c0436739b1cd6262d8b64afa90941',
          category: ['external'],
          withMetadata: true,
          excludeZeroValue: false,
          maxCount: '0x64'
        }]
      };

      const r1 = await fetch(ALCHEMY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const txList = await r1.json();
      const transfers = txList?.result?.transfers || [];

      // For each weekly tx, check internal transfers to our address
      const addrLow = address.toLowerCase();
      const results = [];

      for (const tx of transfers) {
        const receiptBody = {
          id: 1, jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [tx.hash]
        };
        const r2 = await fetch(PUBLIC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(receiptBody)
        });
        const receipt = await r2.json();

        // Use debug_traceTransaction to get internal transfers
        const traceBody = {
          id: 1, jsonrpc: '2.0',
          method: 'debug_traceTransaction',
          params: [tx.hash, { tracer: 'callTracer' }]
        };
        const r3 = await fetch(PUBLIC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(traceBody)
        });
        const trace = await r3.json();

        // Find calls where value goes to our address
        const calls = trace?.result?.calls || [];
        for (const call of calls) {
          if (call.to?.toLowerCase() === addrLow && call.value && call.value !== '0x0') {
            const ethValue = parseInt(call.value, 16) / 1e18;
            results.push({
              hash: tx.hash,
              value: ethValue,
              timestamp: tx.metadata?.blockTimestamp
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
