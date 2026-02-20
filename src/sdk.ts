import type { WidgetContext, WidgetOptions, WidgetEventMap, CreatePostOptions, Post } from "./types"
import type { DevPanel } from "./dev"
import { decodeJwtPayload } from "./utils"

export class HappeNowWidget {
  private context: WidgetContext | null = null
  private token: string | null = null
  private apiUrl: string | null = null
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map()
  private messageHandler: ((e: MessageEvent) => void) | null = null
  private destroyed = false
  private devMode: boolean
  private devPanel: DevPanel | null = null

  constructor(options?: WidgetOptions) {
    if (options?.dev !== undefined) {
      this.devMode = options.dev
    } else if (typeof window !== "undefined") {
      // Auto-detect: not in iframe → dev mode
      this.devMode = window.self === window.top
    } else {
      this.devMode = false
    }
  }

  /**
   * Initialize the widget.
   *
   * **Production**: Sends `happenow:ready` to the parent, then waits for
   * `happenow:init` with the JWT. Times out after 10 seconds.
   *
   * **Dev mode**: Immediately resolves with mock data and injects a floating
   * dev panel for configuring the mock context.
   */
  init(): Promise<WidgetContext> {
    if (this.destroyed) {
      return Promise.reject(new Error("Widget has been destroyed"))
    }

    if (this.devMode) {
      return this.initDev()
    }

    return new Promise<WidgetContext>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Widget init timed out (10s)"))
      }, 10000)

      this.messageHandler = (e: MessageEvent) => {
        if (e.data?.type !== "happenow:init") return

        clearTimeout(timeout)

        try {
          const { token, api_url } = e.data.payload
          if (!token) {
            reject(new Error("No token in init payload"))
            return
          }

          this.token = token
          this.apiUrl = api_url || null

          const payload = decodeJwtPayload(token)

          this.context = {
            eventId: payload.event_id || "",
            userId: payload.sub || "",
            userName: payload.name || "",
            userEmail: payload.email || "",
            userAvatar: payload.picture || null,
            isAdmin: payload.role === "admin",
            registration: payload.registration
              ? {
                  status: payload.registration.status,
                  ticketId: payload.registration.ticket_id,
                  ticketName: payload.registration.ticket_name,
                }
              : null,
            token,
          }

          this.emit("init", this.context)
          resolve(this.context)
        } catch (err) {
          reject(err)
        }
      }

      window.addEventListener("message", this.messageHandler)

      // Signal to parent that we're ready to receive the token
      window.parent.postMessage({ type: "happenow:ready" }, "*")
    })
  }

  /**
   * Create a post on the event's community feed.
   * Requires the widget to be initialized.
   */
  async createPost(options: CreatePostOptions): Promise<Post> {
    if (!this.token) {
      throw new Error("Widget not initialized. Call init() first.")
    }

    // Dev mode: return mock post
    if (this.devMode) {
      console.log("[HappeNow Dev] createPost:", options)
      return {
        id: `post_dev_${Date.now()}`,
        content: options.content,
        createdAt: new Date().toISOString(),
      }
    }

    if (!this.apiUrl) {
      throw new Error("Widget not initialized. Call init() first.")
    }

    const body: Record<string, any> = { content: options.content }
    if (options.images && options.images.length > 0) {
      body.images = options.images
    }

    const res = await fetch(`${this.apiUrl}/api/widget-api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error?.error?.message || `Failed to create post (${res.status})`)
    }

    const data = await res.json()
    return data.post as Post
  }

  /**
   * Request the parent page to resize the widget iframe to the given height.
   */
  resize(height: number): void {
    if (this.devMode) {
      console.log(`[HappeNow Dev] resize(${height})`)
      return
    }
    window.parent.postMessage(
      { type: "happenow:resize", payload: { height } },
      "*"
    )
  }

  /**
   * Register an event listener.
   */
  on<K extends keyof WidgetEventMap>(event: K, callback: (data: WidgetEventMap[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  /**
   * Remove an event listener.
   */
  off<K extends keyof WidgetEventMap>(event: K, callback: (data: WidgetEventMap[K]) => void): void {
    this.listeners.get(event)?.delete(callback)
  }

  /**
   * Clean up listeners and internal state.
   */
  destroy(): void {
    this.destroyed = true
    this.devPanel?.unmount()
    this.devPanel = null
    if (this.messageHandler) {
      window.removeEventListener("message", this.messageHandler)
      this.messageHandler = null
    }
    this.listeners.clear()
    this.context = null
    this.token = null
    this.apiUrl = null
  }

  // ─── Private ─────────────────────────────────────────

  private async initDev(): Promise<WidgetContext> {
    // Dynamic import so dev panel code is only loaded in dev mode
    const { DevPanel, loadConfig, randomMockConfig, buildContext } = await import("./dev")

    const config = loadConfig() || randomMockConfig()

    this.devPanel = new DevPanel(config, (ctx) => {
      this.context = ctx
      this.token = ctx.token
      this.emit("init", ctx)
    })
    this.devPanel.mount()

    const ctx = buildContext(config)
    this.context = ctx
    this.token = ctx.token
    this.emit("init", ctx)
    return ctx
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      for (const cb of callbacks) {
        try {
          cb(data)
        } catch (err) {
          console.error(`[HappeNowWidget] Error in '${event}' listener:`, err)
        }
      }
    }
  }
}
