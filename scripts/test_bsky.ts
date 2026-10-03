import { AtpAgent } from '@atproto/api';

async function main() {
  const agent = new AtpAgent({ service: 'https://bsky.social' });
  // Please substitute with valid credentials if running this
  await agent.login({ identifier: 'xpixenoxx@gmail.com', password: 'test' });
  
  // Create dummy image buffer
  const buffer = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // Fake PNG header
  
  const upload = await agent.uploadBlob(buffer, { encoding: 'image/png' });
  
  const embed = {
    $type: 'app.bsky.embed.images',
    images: [
      {
        image: upload.data.blob,
        alt: 'test image',
      }
    ]
  };
  
  const record = await agent.post({
    text: 'test',
    embed
  });
  
  console.log(record);
}

main().catch(console.error);
