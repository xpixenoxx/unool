# WhatsApp Business Adapter

WhatsApp Cloud API v20.0 adapter for sending Status updates and direct messages.

## Overview

The WhatsApp Adapter enables publishing to WhatsApp Status (broadcast to all contacts) and sending direct messages to individual contacts via WhatsApp Business Cloud API.

### Prerequisites

- **Meta App** with "WhatsApp Business" product added (same App Dashboard as Facebook/Threads)
- **WhatsApp Business Account (WABA)** verified in Meta Business Manager
- **Phone Number** verified in WABA (required for sending)
- **Scopes:** `whatsapp_business_messaging`, `whatsapp_business_management`
- **Webhook:** Same `META_WEBHOOK_SECRET` covers WhatsApp events (`x-hub-signature-256`)

### Dev Mode vs Production

| Aspect | Development Mode | Production (Live) |
|--------|------------------|-------------------|
| Recipients | 5 test numbers | Any WhatsApp user |
| Templates | Pre-approved test templates | Require template approval |
| App Review | Not needed | Required for messaging |
| Status Insights | Not available | Not available |

> **Note:** WhatsApp Status insights are **not available via Cloud API**. Template message analytics available via Business Management API (separate scope).

---

## API Patterns

### Status Updates (Broadcast to Contacts)

Status = WhatsApp "Stories" - visible to all contacts for 24 hours.

**Text Status:**
```json
POST /{phone-number-id}/messages
{
  "messaging_product": "status",
  "status": {
    "text": { "body": "Your status text" }
  }
}
```

**Image/Video Status:**
```json
// 1. Upload media
POST /{phone-number-id}/media (multipart/form-data)
{ file: <binary>, type: "image/video", messaging_product: "whatsapp" }
// Returns: { "id": "media_id" }

// 2. Post status with media
POST /{phone-number-id}/messages
{
  "messaging_product": "status",
  "status": {
    "image": { "id": "media_id", "caption": "Optional caption" }
    // or "video": { "id": "media_id", "caption": "..." }
  }
}
```

### Direct Messages (Individual Contacts)

**Text:**
```json
POST /{phone-number-id}/messages
{
  "messaging_product": "whatsapp",
  "to": "15551234567",  // E.164 without +
  "type": "text",
  "text": { "body": "Hello!" }
}
```

**Media (image/video/document):**
```json
// Requires uploaded media_id first
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "image",
  "image": { "id": "media_id", "caption": "Optional" }
}
```

---

## Reference

### Class: `WhatsAppAdapter`

Implements `PlatformAdapter` interface.

```typescript
export class WhatsAppAdapter implements PlatformAdapter {
  readonly platform = 'whatsapp' as const;
  readonly authConfig: PlatformAuthConfig = {
    clientId: config.META_CLIENT_ID,
    clientSecret: config.META_CLIENT_SECRET,
    redirectUri: config.META_REDIRECT_URI,
    scopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
  };
  // ...
}
```

### Methods

#### `getAuthUrl(state: string): string`
Standard Meta OAuth URL with WhatsApp scopes.

#### `exchangeCodeForToken(code: string): Promise<TokenResponse>`
Exchanges code for user access token (not page token).

#### `refreshAccessToken(refreshToken: string): Promise<TokenResponse>`
Same `th_exchange_token` flow as Facebook/Threads.

#### `getUserProfile(accessToken: string): Promise<UserProfile>`
Fetches WABA and first phone number.

**Returns:**
```typescript
{
  platformUserId: string;      // Phone Number ID (e.g., "123456789012345")
  username: string;            // Phone number in E.164
  displayName: string;         // Display name from WABA
  profileUrl: string;          // https://wa.me/{phone}
  avatarUrl: undefined;
}
```

#### `publish(accessToken: string, input: PublishInput): Promise<PublishResult>`

**Input (extended with WhatsApp-specific fields):**
```typescript
interface PublishInput {
  content: string;
  mediaUrls?: string[];
  firstComment?: string;
  // WhatsApp-specific:
  whatsappMessageType?: 'text' | 'image' | 'video' | 'document' | 'status';
  whatsappRecipientType?: 'contact' | 'status';  // 'status' = broadcast
  whatsappRecipientPhone?: string;  // Required for 'contact' type
}
```

**Logic:**

| recipientType | messageType | Flow |
|---------------|-------------|------|
| `status` | `text` | Direct POST to `/messages` with `messaging_product=status` |
| `status` | `image`/`video` | Upload media → POST status with `media.id` |
| `contact` | `text` | POST to `/messages` with `to` phone |
| `contact` | `image`/`video`/`document` | Upload media → POST message with `media.id` |

**Returns:** `PublishResult` with message ID and wa.me URL.

#### `deletePost(accessToken: string, platformPostId: string): Promise<void>`

**Throws:** `Error` - WhatsApp messages cannot be deleted after sending. Status updates auto-expire after 24h.

#### `getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>>`

**Returns:**
```typescript
{
  views: null,
  replies: null,
  note: 'WhatsApp Status insights not available via Cloud API. Template message analytics available via Business Management API.'
}
```

---

## How-to: Connect WhatsApp Business

### Prerequisites
1. Meta App with WhatsApp Business product added
2. WABA verified in Business Manager (takes days for Live mode)
3. Phone number verified in WABA
4. `META_CLIENT_ID`, `META_CLIENT_SECRET`, `META_REDIRECT_URI` configured

### OAuth Flow

```typescript
// 1. Start OAuth
const adapter = getPlatformAdapter('whatsapp');
const authUrl = adapter.getAuthUrl(state);
// Redirect user

// 2. Callback - exchange code
const tokens = await adapter.exchangeCodeForToken(code);
// tokens.accessToken = USER access token (not phone token!)

// 3. List WABAs
const wabas = await fetch(
  `https://graph.facebook.com/v20.0/me/whatsapp_business_accounts?access_token=${tokens.accessToken}`
);

// 4. User selects WABA → list phone numbers
const phones = await fetch(
  `https://graph.facebook.com/v20.0/${selectedWabaId}/phone_numbers?access_token=${tokens.accessToken}`
);

// 5. User selects phone → store connection
// platformUserId = phoneNumberId
// accessTokenEncrypted = tokens.accessToken (USER token, used for all API calls)
// metadata = { wabaId, phoneNumber, displayName }
```

> **Key Difference from Facebook:** Store the **User access token** (not Page token). The same user token is used for all WhatsApp API calls with `phone_number_id` in the URL path.

---

## How-to: Publish

### Status Update (Broadcast)

```typescript
const connection = await platformRepo.findByWorkspaceAndPlatform(workspaceId, 'whatsapp');
const token = decrypt(connection.accessTokenEncrypted);

const result = await adapter.publish(token, {
  content: 'New blog post published! 🎉',
  whatsappMessageType: 'text',
  whatsappRecipientType: 'status',  // Broadcast to all contacts
});
```

### Image Status

```typescript
const result = await adapter.publish(token, {
  content: 'Check out this image!',
  mediaUrls: ['https://example.com/photo.jpg'],
  whatsappMessageType: 'image',
  whatsappRecipientType: 'status',
});
```

### Direct Message to Contact

```typescript
const result = await adapter.publish(token, {
  content: 'Hi! Thanks for your interest.',
  whatsappMessageType: 'text',
  whatsappRecipientType: 'contact',
  whatsappRecipientPhone: '+15551234567',  // Required for contacts
});
```

### Media Direct Message

```typescript
const result = await adapter.publish(token, {
  content: 'Here\'s the document you requested.',
  mediaUrls: ['https://example.com/doc.pdf'],
  whatsappMessageType: 'document',
  whatsappRecipientType: 'contact',
  whatsappRecipientPhone: '15551234567',  // E.164 without +
});
```

---

## Webhook Handling

WhatsApp uses the same `META_WEBHOOK_SECRET` as Facebook/Threads.

### Events

| Event | Webhook Payload |
|-------|-----------------|
| Message sent | `statuses` array with `status: "sent"`, `status: "delivered"`, `status: "read"` |
| Incoming message | `messages` array with `type: "text"`, `interactive`, etc. |
| Status reply | `messages` with `context.from` = status message ID |

### Verify Signature

```typescript
import { verifyMetaSignature, extractWebhookSignature } from '@/lib/webhooks/verify';

const signature = extractWebhookSignature(request, 'whatsapp'); // reads x-hub-signature-256
const payload = await request.text();
const valid = await verifyMetaSignature(payload, signature, 'whatsapp');
```

---

## Explanation: No Status Analytics

WhatsApp Cloud API **does not provide insights** for Status updates:
- No view counts
- No reply counts  
- No reach metrics

Only **template message** analytics are available via Business Management API (requires `whatsapp_business_management` scope and separate endpoints).

For Status performance, rely on:
1. Direct replies (incoming messages with `context.from`)
2. Click tracking via UTM parameters in links
3. Manual feedback from contacts

---

## Related

- [Platform Adapter Interface](../adapter.ts)
- [Facebook Adapter](./facebook.md) - Same OAuth infrastructure
- [Threads Adapter](./threads.md) - Same Meta App
- [WhatsApp Cloud API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [Webhook Verification](../webhooks/verify.ts)
- [WhatsApp Business Setup Guide](https://developers.facebook.com/docs/whatsapp/getting-started/)