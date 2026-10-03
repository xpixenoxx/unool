const { AtpAgent } = require('@atproto/api');

async function main() {
  const agent = new AtpAgent({ service: 'https://bsky.social' });
  const loginRes = await agent.login({ identifier: 'avadika.bsky.social', password: 'xx' }); // I will put fake password, but I just want to see the type if it fails or succeeds? No, I need a real account to see the response.
}
main();
