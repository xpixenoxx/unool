import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function renderCallbackHtml(orderId: string, status: string): string {
  const safeOrderId = orderId.replace(/[^a-zA-Z0-9_\-]/g, '');
  const safeStatus = status.replace(/[^a-zA-Z0-9_\-]/g, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment Verification • Unool</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: #0F0E0D;
      color: #E6E4DD;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .card {
      background: #181614;
      border: 1px solid #2B2824;
      border-radius: 16px;
      padding: 32px 24px;
      max-width: 380px;
      width: 100%;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(139, 92, 246, 0.2);
      border-top-color: #8B5CF6;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
      margin: 0 auto 18px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 {
      font-size: 17px;
      font-weight: 700;
      margin: 0 0 8px;
      color: #FFFFFF;
    }
    p {
      font-size: 13px;
      color: #9C948A;
      margin: 0 0 16px;
      line-height: 1.5;
    }
    .btn {
      display: inline-block;
      background: #7C3AED;
      color: #FFFFFF;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      padding: 9px 18px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>Updating Payment Status</h2>
    <p>Returning to your Unool dashboard...</p>
    <button class="btn" id="close-btn" onclick="handleManualClose()">Return to Billing</button>
  </div>

  <script>
    var orderId = ${JSON.stringify(safeOrderId)};
    var status = ${JSON.stringify(safeStatus)};

    function handleManualClose() {
      try {
        if (window.opener && !window.opener.closed) {
          window.close();
        } else {
          window.location.replace('/dashboard/billing?order_id=' + encodeURIComponent(orderId) + '&status=' + encodeURIComponent(status));
        }
      } catch (e) {
        window.location.replace('/dashboard/billing?order_id=' + encodeURIComponent(orderId) + '&status=' + encodeURIComponent(status));
      }
    }

    (function() {
      try {
        // If loaded inside a popup / 3DS authentication window
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({
            type: 'UNO_CF_PAYMENT_STATUS',
            orderId: orderId,
            status: status
          }, '*');
          
          // Close popup immediately so it doesn't linger or reload dashboard inside popup
          setTimeout(function() {
            try { window.close(); } catch (e) {}
          }, 150);
          return;
        }
      } catch (err) {
        console.warn('Unable to postMessage to opener:', err);
      }

      // If opened in full tab or mobile redirect, redirect to dashboard billing
      setTimeout(function() {
        window.location.replace('/dashboard/billing?order_id=' + encodeURIComponent(orderId) + '&status=' + encodeURIComponent(status));
      }, 300);
    })();
  </script>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('order_id') || searchParams.get('orderId') || '';
  const status = searchParams.get('status') || searchParams.get('order_status') || 'PENDING';

  return new NextResponse(renderCallbackHtml(orderId, status), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let orderId = searchParams.get('order_id') || searchParams.get('orderId') || '';
  let status = searchParams.get('status') || searchParams.get('order_status') || 'PENDING';

  try {
    const formData = await request.formData().catch(() => null);
    if (formData) {
      orderId = (formData.get('order_id') as string) || (formData.get('orderId') as string) || orderId;
      status = (formData.get('order_status') as string) || (formData.get('status') as string) || status;
    }
  } catch {}

  return new NextResponse(renderCallbackHtml(orderId, status), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
