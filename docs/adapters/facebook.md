# Facebook Pages Adapter

**Platform:** `facebook`  
**API:** Meta Graph API v20.0  
**OAuth:** Standard Meta OAuth (same as Threads/WhatsApp)

---

## Overview

Publishes posts to Facebook Pages using Page access tokens. Supports text, image, multi-image, video, and link posts with optional first comment.

**Key difference from Threads:** Uses Facebook Pages API (`/me/accounts` → page tokens) instead of Threads profile API.

---

## OAuth Flow

```
1. GET /dialog/oauth → User grants pages_show_list, pages_read_engagement, pages_manage_posts
2. Exchange code → User access token (short-lived ~1h)
3. GET /me/accounts → List user's Pages with page_access_token
4. User selects Page → Store page_id + page_access_token
5. Publish using page_access_token
```

### Scopes

```typescript
scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'];
```

### Token Storage

| Field | Value |
|-------|-------|
| `platformUserId` | Page ID (e.g., `123456789012345`) |
| `accessTokenEncrypted` | Page access token |
| `refreshTokenEncrypted` | User access token (for refresh) |
| `metadata` | `{ pageName, pageCategory }` |

---

## Publishing

### Text Post
```http
POST /{page-id}/feed
message={content}
access_token={page_token}
```

### Image Post (single)
```http
# 1. Upload unpublished photo
POST /{page-id}/photos
url={image_url}&published=false&access_token={page_token}

# Returns: { "id": "media_id" }

# 2. Publish with attached media
POST /{page-id}/feed
message={content}
attached_media=[{ "media_fbid": "media_id" }]
access_token={page_token}
```

### Multi-Image Post
Same as single image, but:
```json
attached_media=[
  { "media_fbid": "media_id_1" },
  { "media_fbid": "media_id_2" },
  ...
]
```

### Video Post
```http
POST /{page-id}/videos
file_url={video_url}
description={content}
access_token={page_token}

# Async - poll for status
GET /{video-id}?fields=status&access_token={page_token}
# Wait for status.video_status === "ready"
```

### Link Post
```http
POST /{page-id}/feed
link={url}&message={content}
access_token={page_token}
```

### First Comment
After main post succeeds:
```http
POST /{post-id}/comments
message={firstComment}&access_token={page_token}
```

---

## Engagement Metrics

```http
GET /{post-id}/insights
metric=post_impressions,post_engaged_users,post_reactions_like_total,post_clicks_total,post_shares,post_video_views
access_token={page_token}
```

### Mapped Response

| API Metric | Output Field |
|------------|--------------|
| `post_impressions` | `impressions` |
| `post_engaged_users` | `engagedUsers` |
| `post_reactions_like_total` | `likes` |
| `post_clicks_total` | `clicks` |
| `post_shares` | `shares` |
| `post_video_views` | `videoViews` |

---

## Token Refresh

**Page tokens expire ~60 days.** Refresh flow:

```http
# 1. Exchange user token for new user token
POST /oauth/access_token
grant_type=th_exchange_token
client_id={app_id}
client_secret={app_secret}
access_token={stored_user_refresh_token}

# 2. Use new user token to get fresh page token
GET /{page-id}?fields=access_token&access_token={new_user_token}
```

Implemented in `refreshAccessToken(refreshToken)` where `refreshToken` = stored user token.

---

## Webhook Events

Uses shared `META_WEBHOOK_SECRET`. Verify with `verifyMetaSignature()`.

### Page Webhook Fields
- `feed` - new posts, comments
- `leadgen` - lead forms (if configured)

---

## Helper Methods (Onboarding)

```typescript
// Get all pages user manages
await facebookAdapter.getUserPages(userAccessToken);
// Returns: [{ id, name, category, access_token, tasks }]

// Get page token for specific page
await facebookAdapter.getPageAccessToken(userAccessToken, pageId);
// Returns: page_access_token string
```

---

## Configuration

```env
META_CLIENT_ID=your_app_id
META_CLIENT_SECRET=your_app_secret
META_REDIRECT_URI=https://yourdomain.com/auth/callback/meta
META_WEBHOOK_SECRET=your_webhook_secret
```

---

## Development Mode Testing

1. Create Meta App → Add "Facebook Login" + "Pages" products
2. App Review **NOT required** for:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
3. Add test users in App Dashboard → Roles → Test Users
4. Test user must have a Facebook Page (create in test user's FB)
5. Use app in Development Mode with test users only

---

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `#100 Invalid parameter` | Missing/invalid field | Check `message`, `url`, `attached_media` format |
| `#200 Permissions error` | Token lacks scope | Re-auth with `pages_manage_posts` |
| `#190 Invalid post ID` | Wrong post ID format | Use `pageid_postid` format |
| `#341 Video processing` | Video still processing | Poll status; don't retry publish |

---

## Related

- [Meta Graph API v20.0 Reference](https://developers.facebook.com/docs/graph-api/reference/v20.0/)
- [Pages API - Publishing](https://developers.facebook.com/docs/pages/publishing/)
- [Page Insights Metrics](https://developers.facebook.com/docs/pages/insights/)
- [WhatsApp Adapter](./whatsapp.md)
- [Threads Adapter](../platforms/ThreadsAdapter.ts)