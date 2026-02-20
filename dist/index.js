// src/utils.ts
function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");
  const payload = parts[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  const decoded = atob(padded);
  return JSON.parse(decoded);
}

// src/sdk.ts
var HappeNowWidget = class {
  constructor() {
    this.context = null;
    this.token = null;
    this.apiUrl = null;
    this.listeners = /* @__PURE__ */ new Map();
    this.messageHandler = null;
    this.destroyed = false;
  }
  /**
   * Initialize the widget.
   * Sends `happenow:ready` to the parent, then waits for `happenow:init` with the token.
   * Returns the widget context derived from the JWT payload.
   */
  init() {
    if (this.destroyed) {
      return Promise.reject(new Error("Widget has been destroyed"));
    }
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Widget init timed out (10s)"));
      }, 1e4);
      this.messageHandler = (e) => {
        if (e.data?.type !== "happenow:init") return;
        clearTimeout(timeout);
        try {
          const { token, api_url } = e.data.payload;
          if (!token) {
            reject(new Error("No token in init payload"));
            return;
          }
          this.token = token;
          this.apiUrl = api_url || null;
          const payload = decodeJwtPayload(token);
          this.context = {
            eventId: payload.event_id || "",
            userId: payload.sub || "",
            userName: payload.name || "",
            userEmail: payload.email || "",
            userAvatar: payload.picture || null,
            isAdmin: payload.role === "admin",
            registration: payload.registration ? {
              status: payload.registration.status,
              ticketId: payload.registration.ticket_id,
              ticketName: payload.registration.ticket_name
            } : null,
            token
          };
          this.emit("init", this.context);
          resolve(this.context);
        } catch (err) {
          reject(err);
        }
      };
      window.addEventListener("message", this.messageHandler);
      window.parent.postMessage({ type: "happenow:ready" }, "*");
    });
  }
  /**
   * Create a post (blats) on the event's community feed.
   * Requires the widget to be initialized.
   */
  async createPost(options) {
    if (!this.token || !this.apiUrl) {
      throw new Error("Widget not initialized. Call init() first.");
    }
    const body = { content: options.content };
    if (options.images && options.images.length > 0) {
      body.images = options.images;
    }
    const res = await fetch(`${this.apiUrl}/api/widget-api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error?.error?.message || `Failed to create post (${res.status})`);
    }
    const data = await res.json();
    return data.post;
  }
  /**
   * Request the parent page to resize the widget iframe to the given height.
   */
  resize(height) {
    window.parent.postMessage(
      { type: "happenow:resize", payload: { height } },
      "*"
    );
  }
  /**
   * Register an event listener.
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(callback);
  }
  /**
   * Remove an event listener.
   */
  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }
  /**
   * Clean up listeners and internal state.
   */
  destroy() {
    this.destroyed = true;
    if (this.messageHandler) {
      window.removeEventListener("message", this.messageHandler);
      this.messageHandler = null;
    }
    this.listeners.clear();
    this.context = null;
    this.token = null;
    this.apiUrl = null;
  }
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const cb of callbacks) {
        try {
          cb(data);
        } catch (err) {
          console.error(`[HappeNowWidget] Error in '${event}' listener:`, err);
        }
      }
    }
  }
};
export {
  HappeNowWidget
};
