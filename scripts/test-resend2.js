require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

async function testResend() {
  console.log('Testing Resend with noreply@unool.co...');
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    const res = await resend.emails.send({
      from: 'noreply@unool.co',
      to: 'keras1792@gmail.com',
      subject: 'Test Email',
      html: '<p>Test</p>'
    });
    console.log('Response:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testResend();
