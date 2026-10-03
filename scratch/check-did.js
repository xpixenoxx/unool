const { AtpAgent } = require('@atproto/api');

async function main() {
  const agent = new AtpAgent({ service: 'https://bsky.social' });
  const did = 'did:plc:ragtjsm2j2vhmhdku7ddxcvc'; // Paul Frazee's DID for example, or any DID
  
  try {
    const res = await agent.resolveDid(did);
    console.log(JSON.stringify(res, null, 2));
    
    // Check if there is a helper for PDS DID
    const pdsUrl = res.service?.find(s => s.id === '#atproto_pds')?.serviceEndpoint;
    if (pdsUrl) {
      const pdsUrlObj = new URL(pdsUrl);
      const pdsDid = `did:web:${pdsUrlObj.hostname}`;
      console.log('Constructed PDS DID:', pdsDid);
    }
  } catch (err) {
    console.error(err);
  }
}

main();
