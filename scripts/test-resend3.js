require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

async function testResend() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    const res = await resend.emails.send({
      from: 'noreply@unool.co',
      to: 'keras1792@gmail.com',
      subject: 'Test Email',
      html: '<p>Test</p>'
    });
    require('fs').writeFileSync('resend-test.json', JSON.stringify({ success: true, res }, null, 2));
  } catch (err) {
    require('fs').writeFileSync('resend-test.json', JSON.stringify({ success: false, err: { message: err.message, name: err.name, statusCode: err.statusCode } }, null, 2));
  }
}

testResend();
