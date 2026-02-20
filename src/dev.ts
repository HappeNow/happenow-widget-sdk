import type { WidgetContext } from "./types"

// ─── Constants ───────────────────────────────────────────

const STORAGE_KEY = "hn-widget-dev"
const P = "hn-dev" // class name prefix

const FIRST_NAMES = ["Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery", "Dakota"]
const LAST_NAMES = ["Chen", "Smith", "Kim", "Garcia", "Patel", "Johnson", "Lee", "Wilson", "Zhang", "Brown"]
const TICKET_NAMES = ["General Admission", "VIP Pass", "Early Bird", "Student Ticket", "Speaker Pass", "Workshop"]

// ─── Mock Config ─────────────────────────────────────────

export interface MockConfig {
  eventId: string
  userId: string
  userName: string
  userEmail: string
  userAvatar: string
  isAdmin: boolean
  hasRegistration: boolean
  registrationStatus: "pending" | "approved" | "cancelled" | "rejected"
  ticketId: string
  ticketName: string
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomHex(len: number): string {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join("")
}

function randomAlphaNum(len: number): string {
  const c = "abcdefghijklmnopqrstuvwxyz0123456789"
  return Array.from({ length: len }, () => c[Math.floor(Math.random() * c.length)]).join("")
}

export function randomMockConfig(): MockConfig {
  const first = pick(FIRST_NAMES)
  const last = pick(LAST_NAMES)
  return {
    eventId: `evt_${randomAlphaNum(20)}`,
    userId: randomHex(64),
    userName: `${first} ${last}`,
    userEmail: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    userAvatar: "",
    isAdmin: Math.random() > 0.7,
    hasRegistration: Math.random() > 0.2,
    registrationStatus: pick(["approved", "approved", "approved", "pending"]),
    ticketId: `tkt_${randomAlphaNum(16)}`,
    ticketName: pick(TICKET_NAMES),
  }
}

// ─── Persistence ─────────────────────────────────────────

export function loadConfig(): MockConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveConfig(config: MockConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch { /* noop */ }
}

// ─── Build Context ───────────────────────────────────────

function createMockToken(c: MockConfig): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const payload = btoa(JSON.stringify({
    sub: c.userId,
    app_id: "dev_app",
    client_id: "dev_client",
    event_id: c.eventId,
    name: c.userName,
    email: c.userEmail,
    picture: c.userAvatar || null,
    type: "widget",
    role: c.isAdmin ? "admin" : null,
    registration: c.hasRegistration ? {
      status: c.registrationStatus,
      ticket_id: c.ticketId,
      ticket_name: c.ticketName,
    } : null,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }))
  return `${header}.${payload}.dev-mock-signature`
}

export function buildContext(c: MockConfig): WidgetContext {
  return {
    eventId: c.eventId,
    userId: c.userId,
    userName: c.userName,
    userEmail: c.userEmail,
    userAvatar: c.userAvatar || null,
    isAdmin: c.isAdmin,
    registration: c.hasRegistration ? {
      status: c.registrationStatus,
      ticketId: c.ticketId,
      ticketName: c.ticketName,
    } : null,
    token: createMockToken(c),
  }
}

// ─── CSS ─────────────────────────────────────────────────

const CSS = /* css */`
.${P}-badge {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 99999;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(124,58,237,0.3);
  transition: transform 0.15s, box-shadow 0.15s;
  user-select: none;
}
.${P}-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124,58,237,0.4);
}
.${P}-badge:active { transform: scale(0.97); }
.${P}-badge svg { width: 14px; height: 14px; }

.${P}-panel {
  position: fixed;
  bottom: 58px;
  left: 16px;
  z-index: 99998;
  width: 340px;
  max-height: calc(100vh - 80px);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05);
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transform: translateY(8px) scale(0.98);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.${P}-panel.${P}-open {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.${P}-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f4f4f5;
}
.${P}-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #18181b;
}
.${P}-header-title svg { width: 16px; height: 16px; color: #7c3aed; }

.${P}-close {
  width: 24px; height: 24px;
  border: none; border-radius: 6px;
  background: none; color: #a1a1aa;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.${P}-close:hover { background: #f4f4f5; color: #52525b; }

.${P}-body {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.${P}-section { margin-bottom: 16px; }
.${P}-section:last-child { margin-bottom: 0; }
.${P}-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #a1a1aa;
  margin-bottom: 8px;
}

.${P}-field { margin-bottom: 8px; }
.${P}-field:last-child { margin-bottom: 0; }
.${P}-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: #71717a;
  margin-bottom: 4px;
}

.${P}-input,
.${P}-select {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  background: #fafafa;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #18181b;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}
.${P}-input:focus,
.${P}-select:focus {
  border-color: #a78bfa;
  box-shadow: 0 0 0 2px rgba(167,139,250,0.15);
}
.${P}-select {
  font-family: system-ui, -apple-system, sans-serif;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='M3 4.5 6 7.5 9 4.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 28px;
}

.${P}-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.${P}-toggle-track {
  width: 36px; height: 20px;
  border-radius: 10px;
  background: #e4e4e7;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}
.${P}-toggle-track.${P}-on { background: #7c3aed; }
.${P}-toggle-thumb {
  position: absolute;
  top: 2px; left: 2px;
  width: 16px; height: 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  transition: transform 0.2s;
}
.${P}-toggle-track.${P}-on .${P}-toggle-thumb { transform: translateX(16px); }
.${P}-toggle-label { font-size: 12px; color: #52525b; }

.${P}-footer {
  padding: 12px 16px;
  border-top: 1px solid #f4f4f5;
  display: flex;
  gap: 8px;
}
.${P}-btn {
  flex: 1;
  height: 32px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.15s;
}
.${P}-btn-outline {
  border: 1px solid #e4e4e7;
  background: #fff;
  color: #52525b;
}
.${P}-btn-outline:hover { background: #f4f4f5; }
.${P}-btn-primary {
  border: none;
  background: #7c3aed;
  color: #fff;
}
.${P}-btn-primary:hover { background: #6d28d9; }

.${P}-reg-fields {
  overflow: hidden;
  transition: max-height 0.2s ease, opacity 0.2s ease;
}
`

// ─── SVG Icons ───────────────────────────────────────────

const SPARK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"/></svg>`

const CLOSE_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`

// ─── HTML Template ───────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function panelHTML(c: MockConfig): string {
  const statusOpts = (["approved", "pending", "cancelled", "rejected"] as const)
    .map(s => `<option value="${s}"${s === c.registrationStatus ? " selected" : ""}>${s}</option>`)
    .join("")

  return `
    <div class="${P}-header">
      <div class="${P}-header-title">${SPARK_SVG} HappeNow Dev Tools</div>
      <button class="${P}-close" data-action="close">${CLOSE_SVG}</button>
    </div>
    <div class="${P}-body">
      <div class="${P}-section">
        <div class="${P}-section-title">User</div>
        <div class="${P}-field">
          <label class="${P}-label">Name</label>
          <input class="${P}-input" data-field="userName" value="${esc(c.userName)}" />
        </div>
        <div class="${P}-field">
          <label class="${P}-label">Email</label>
          <input class="${P}-input" data-field="userEmail" value="${esc(c.userEmail)}" />
        </div>
        <div class="${P}-field">
          <label class="${P}-label">Avatar URL</label>
          <input class="${P}-input" data-field="userAvatar" value="${esc(c.userAvatar)}" placeholder="https://..." />
        </div>
        <div class="${P}-field">
          <label class="${P}-label">User ID</label>
          <input class="${P}-input" data-field="userId" value="${esc(c.userId)}" />
        </div>
        <div class="${P}-field">
          <div class="${P}-toggle" data-action="toggle-admin">
            <div class="${P}-toggle-track${c.isAdmin ? ` ${P}-on` : ""}" data-toggle="admin">
              <div class="${P}-toggle-thumb"></div>
            </div>
            <span class="${P}-toggle-label">Admin</span>
          </div>
        </div>
      </div>

      <div class="${P}-section">
        <div class="${P}-section-title">Event</div>
        <div class="${P}-field">
          <label class="${P}-label">Event ID</label>
          <input class="${P}-input" data-field="eventId" value="${esc(c.eventId)}" />
        </div>
      </div>

      <div class="${P}-section">
        <div class="${P}-section-title">Registration</div>
        <div class="${P}-field">
          <div class="${P}-toggle" data-action="toggle-reg">
            <div class="${P}-toggle-track${c.hasRegistration ? ` ${P}-on` : ""}" data-toggle="reg">
              <div class="${P}-toggle-thumb"></div>
            </div>
            <span class="${P}-toggle-label">Has Registration</span>
          </div>
        </div>
        <div class="${P}-reg-fields" data-reg-fields style="max-height:${c.hasRegistration ? "200px" : "0"};opacity:${c.hasRegistration ? "1" : "0"}">
          <div class="${P}-field">
            <label class="${P}-label">Status</label>
            <select class="${P}-select" data-field="registrationStatus">${statusOpts}</select>
          </div>
          <div class="${P}-field">
            <label class="${P}-label">Ticket Name</label>
            <input class="${P}-input" data-field="ticketName" value="${esc(c.ticketName)}" />
          </div>
          <div class="${P}-field">
            <label class="${P}-label">Ticket ID</label>
            <input class="${P}-input" data-field="ticketId" value="${esc(c.ticketId)}" />
          </div>
        </div>
      </div>
    </div>
    <div class="${P}-footer">
      <button class="${P}-btn ${P}-btn-outline" data-action="randomize">🎲 Randomize</button>
      <button class="${P}-btn ${P}-btn-primary" data-action="apply">✓ Apply</button>
    </div>`
}

// ─── DevPanel Class ──────────────────────────────────────

export class DevPanel {
  private badge: HTMLButtonElement | null = null
  private panel: HTMLDivElement | null = null
  private style: HTMLStyleElement | null = null
  private config: MockConfig
  private isOpen = false
  private onApply: (ctx: WidgetContext) => void

  constructor(config: MockConfig, onApply: (ctx: WidgetContext) => void) {
    this.config = config
    this.onApply = onApply
  }

  getInitialContext(): WidgetContext {
    return buildContext(this.config)
  }

  mount(): void {
    // Inject CSS
    this.style = document.createElement("style")
    this.style.textContent = CSS
    document.head.appendChild(this.style)

    // Badge
    this.badge = document.createElement("button")
    this.badge.className = `${P}-badge`
    this.badge.innerHTML = `${SPARK_SVG} DEV`
    this.badge.addEventListener("click", () => this.toggle())
    document.body.appendChild(this.badge)

    // Panel
    this.panel = document.createElement("div")
    this.panel.className = `${P}-panel`
    this.panel.innerHTML = panelHTML(this.config)
    document.body.appendChild(this.panel)

    this.bindEvents()
  }

  unmount(): void {
    this.style?.remove()
    this.badge?.remove()
    this.panel?.remove()
    this.style = null
    this.badge = null
    this.panel = null
  }

  private toggle(): void {
    this.isOpen = !this.isOpen
    this.panel?.classList.toggle(`${P}-open`, this.isOpen)
  }

  private bindEvents(): void {
    if (!this.panel) return
    this.panel.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest("[data-action]") as HTMLElement | null
      if (!target) return
      const action = target.dataset.action
      if (action === "close") this.toggle()
      else if (action === "apply") this.apply()
      else if (action === "randomize") this.randomize()
      else if (action === "toggle-admin") this.toggleSwitch("admin")
      else if (action === "toggle-reg") this.toggleSwitch("reg")
    })
  }

  private toggleSwitch(name: string): void {
    const track = this.panel?.querySelector(`[data-toggle="${name}"]`) as HTMLElement | null
    if (!track) return
    track.classList.toggle(`${P}-on`)

    if (name === "reg") {
      const fields = this.panel?.querySelector("[data-reg-fields]") as HTMLElement | null
      if (fields) {
        const on = track.classList.contains(`${P}-on`)
        fields.style.maxHeight = on ? "200px" : "0"
        fields.style.opacity = on ? "1" : "0"
      }
    }
  }

  private readForm(): MockConfig {
    const val = (f: string) =>
      (this.panel?.querySelector(`[data-field="${f}"]`) as HTMLInputElement | null)?.value ?? ""

    return {
      userName: val("userName"),
      userEmail: val("userEmail"),
      userAvatar: val("userAvatar"),
      userId: val("userId"),
      eventId: val("eventId"),
      isAdmin: this.panel?.querySelector('[data-toggle="admin"]')?.classList.contains(`${P}-on`) ?? false,
      hasRegistration: this.panel?.querySelector('[data-toggle="reg"]')?.classList.contains(`${P}-on`) ?? false,
      registrationStatus: val("registrationStatus") as MockConfig["registrationStatus"],
      ticketName: val("ticketName"),
      ticketId: val("ticketId"),
    }
  }

  private apply(): void {
    this.config = this.readForm()
    saveConfig(this.config)
    this.onApply(buildContext(this.config))

    // Visual feedback
    const btn = this.panel?.querySelector('[data-action="apply"]') as HTMLElement | null
    if (btn) {
      const original = btn.textContent
      btn.textContent = "✓ Applied!"
      setTimeout(() => { btn.textContent = original }, 1000)
    }
  }

  private randomize(): void {
    this.config = randomMockConfig()
    saveConfig(this.config)
    if (this.panel) {
      this.panel.innerHTML = panelHTML(this.config)
      this.panel.classList.add(`${P}-open`)
      this.isOpen = true
      this.bindEvents()
    }
  }
}
