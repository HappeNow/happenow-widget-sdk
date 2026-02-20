interface WidgetContext {
    eventId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatar: string | null;
    isAdmin: boolean;
    registration: {
        status: "pending" | "approved" | "cancelled" | "rejected";
        ticketId: string;
        ticketName: string;
    } | null;
    token: string;
}
interface CreatePostOptions {
    content: string;
    images?: string[];
}
interface Post {
    id: string;
    content: string;
    createdAt: string;
}
type WidgetEventMap = {
    init: WidgetContext;
};

declare class HappeNowWidget {
    private context;
    private token;
    private apiUrl;
    private listeners;
    private messageHandler;
    private destroyed;
    /**
     * Initialize the widget.
     * Sends `happenow:ready` to the parent, then waits for `happenow:init` with the token.
     * Returns the widget context derived from the JWT payload.
     */
    init(): Promise<WidgetContext>;
    /**
     * Create a post (blats) on the event's community feed.
     * Requires the widget to be initialized.
     */
    createPost(options: CreatePostOptions): Promise<Post>;
    /**
     * Request the parent page to resize the widget iframe to the given height.
     */
    resize(height: number): void;
    /**
     * Register an event listener.
     */
    on<K extends keyof WidgetEventMap>(event: K, callback: (data: WidgetEventMap[K]) => void): void;
    /**
     * Remove an event listener.
     */
    off<K extends keyof WidgetEventMap>(event: K, callback: (data: WidgetEventMap[K]) => void): void;
    /**
     * Clean up listeners and internal state.
     */
    destroy(): void;
    private emit;
}

export { type CreatePostOptions, HappeNowWidget, type Post, type WidgetContext, type WidgetEventMap };
