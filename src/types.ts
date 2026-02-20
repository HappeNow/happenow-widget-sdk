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
