export interface WidgetOptions {
  /**
   * Explicitly enable or disable dev mode.
   * When `true`, injects a floating dev panel for mock data configuration.
   * When `undefined`, auto-detects: dev mode activates when not inside an iframe.
   */
  dev?: boolean
}

export interface WidgetContext {
  eventId: string
  userId: string
  userName: string
  userEmail: string
  userAvatar: string | null
  isAdmin: boolean
  registration: {
    status: "pending" | "approved" | "cancelled" | "rejected"
    ticketId: string
    ticketName: string
  } | null
  token: string
}

export interface CreatePostOptions {
  content: string
  images?: string[]
}

export interface Post {
  id: string
  content: string
  createdAt: string
}

export type WidgetEventMap = {
  init: WidgetContext
}
