# @happenow/widget-sdk

SDK for building [HappeNow](https://happenow.app) widgets. Zero dependencies.

## Install

Configure your `.npmrc` to use GitHub Packages for the `@happenow` scope:

```
@happenow:registry=https://npm.pkg.github.com
```

Then install:

```bash
npm install @happenow/widget-sdk
```

## Quick Start

```typescript
import { HappeNowWidget } from "@happenow/widget-sdk"

const widget = new HappeNowWidget()

const ctx = await widget.init()

console.log(ctx.userName)       // "Alice"
console.log(ctx.isAdmin)        // true
console.log(ctx.registration)   // { status: "approved", ticketId: "abc", ticketName: "GA" }
```

## API

### `new HappeNowWidget()`

Create a widget instance.

### `widget.init(): Promise<WidgetContext>`

Initialize the widget. Automatically sends `happenow:ready` to the parent page and waits for the `happenow:init` message containing the JWT token.

Returns a `WidgetContext` with the following fields:

| Field          | Type                        | Description                          |
|----------------|-----------------------------|--------------------------------------|
| `eventId`      | `string`                    | Current event ID                     |
| `userId`       | `string`                    | Pairwise user ID (unique per widget) |
| `userName`     | `string`                    | User display name                    |
| `userEmail`    | `string`                    | User email                           |
| `userAvatar`   | `string \| null`            | User avatar URL                      |
| `isAdmin`      | `boolean`                   | Whether user can manage the event    |
| `registration` | `Registration \| null`      | User's registration info             |
| `token`        | `string`                    | Raw JWT for custom API calls         |

`Registration` shape:

```typescript
{
  status: "pending" | "approved" | "cancelled" | "rejected"
  ticketId: string
  ticketName: string
}
```

### `widget.createPost(options): Promise<Post>`

Publish a post to the event's community feed.

```typescript
const post = await widget.createPost({
  content: "Hello from my widget!",
  images: ["https://example.com/photo.jpg"],  // optional
})

console.log(post.id)        // "aBcDeFgH"
console.log(post.createdAt) // "2026-02-20T10:00:00.000Z"
```

Requires the user to be an event admin or an approved registrant.

### `widget.resize(height: number)`

Request the parent page to resize the widget iframe.

```typescript
widget.resize(400)
```

### `widget.on(event, callback)` / `widget.off(event, callback)`

Listen for widget events.

```typescript
widget.on("init", (ctx) => {
  console.log("Widget initialized:", ctx.userName)
})
```

### `widget.destroy()`

Clean up all listeners and internal state. Call this when your widget unmounts.

## Using the Raw Token

For custom API calls, use `ctx.token` directly:

```typescript
const ctx = await widget.init()

const res = await fetch("https://api.happenow.app/api/widget-api/posts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ctx.token}`,
  },
  body: JSON.stringify({ content: "Hello!" }),
})
```

## TypeScript

All types are exported:

```typescript
import type { WidgetContext, CreatePostOptions, Post } from "@happenow/widget-sdk"
```

## License

MIT
