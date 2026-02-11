// Offline Queue Manager for PWA
// Handles offline actions and syncs when back online

const OFFLINE_QUEUE_KEY = 'jove-offline-queue';
const OFFLINE_CART_KEY = 'jove-offline-cart';

interface OfflineAction {
    id: string;
    type: 'order' | 'cart_update' | 'account_update';
    data: any;
    timestamp: number;
    retries: number;
}

class OfflineQueueManager {
    private queue: OfflineAction[] = [];

    constructor() {
        this.loadQueue();
        this.setupOnlineListener();
    }

    // Load queue from localStorage
    private loadQueue() {
        try {
            const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
            this.queue = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load offline queue:', error);
            this.queue = [];
        }
    }

    // Save queue to localStorage
    private saveQueue() {
        try {
            localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
        } catch (error) {
            console.error('Failed to save offline queue:', error);
        }
    }

    // Add action to queue
    addToQueue(type: OfflineAction['type'], data: any): string {
        const action: OfflineAction = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            timestamp: Date.now(),
            retries: 0,
        };

        this.queue.push(action);
        this.saveQueue();

        console.log('📦 Added to offline queue:', action);
        return action.id;
    }

    // Process queue when online
    async processQueue() {
        if (!navigator.onLine || this.queue.length === 0) {
            return;
        }

        console.log('🔄 Processing offline queue:', this.queue.length, 'items');

        const processedIds: string[] = [];

        for (const action of this.queue) {
            try {
                await this.processAction(action);
                processedIds.push(action.id);
                console.log('✅ Processed offline action:', action.id);
            } catch (error) {
                console.error('❌ Failed to process action:', action.id, error);
                action.retries++;

                // Remove after 3 failed retries
                if (action.retries >= 3) {
                    processedIds.push(action.id);
                    console.warn('⚠️ Removing failed action after 3 retries:', action.id);
                }
            }
        }

        // Remove processed actions
        this.queue = this.queue.filter(action => !processedIds.includes(action.id));
        this.saveQueue();

        if (processedIds.length > 0) {
            this.notifyUser(`Synced ${processedIds.length} offline action(s)`);
        }
    }

    // Process individual action
    private async processAction(action: OfflineAction): Promise<void> {
        switch (action.type) {
            case 'order':
                await this.syncOrder(action.data);
                break;
            case 'cart_update':
                await this.syncCart(action.data);
                break;
            case 'account_update':
                await this.syncAccount(action.data);
                break;
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }

    // Sync order
    private async syncOrder(orderData: any): Promise<void> {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            throw new Error('Failed to sync order');
        }
    }

    // Sync cart
    private async syncCart(cartData: any): Promise<void> {
        const response = await fetch('/api/cart/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cartData),
        });

        if (!response.ok) {
            throw new Error('Failed to sync cart');
        }
    }

    // Sync account updates
    private async syncAccount(accountData: any): Promise<void> {
        const response = await fetch('/api/account/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accountData),
        });

        if (!response.ok) {
            throw new Error('Failed to sync account');
        }
    }

    // Setup online/offline listeners
    private setupOnlineListener() {
        window.addEventListener('online', () => {
            console.log('🌐 Back online! Processing queue...');
            this.processQueue();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Gone offline. Actions will be queued.');
        });

        // Process queue on load if online
        if (navigator.onLine) {
            setTimeout(() => this.processQueue(), 1000);
        }
    }

    // Notify user
    private notifyUser(message: string) {
        // Dispatch custom event for toast notification
        window.dispatchEvent(new CustomEvent('offline-sync', {
            detail: { message }
        }));
    }

    // Get queue status
    getQueueStatus() {
        return {
            pending: this.queue.length,
            items: this.queue,
            isOnline: navigator.onLine,
        };
    }

    // Clear queue (for testing)
    clearQueue() {
        this.queue = [];
        this.saveQueue();
    }
}

// Export singleton instance
export const offlineQueue = new OfflineQueueManager();

// Helper functions for offline cart management
export const OfflineCart = {
    save(cart: any) {
        try {
            localStorage.setItem(OFFLINE_CART_KEY, JSON.stringify({
                cart,
                timestamp: Date.now(),
            }));
        } catch (error) {
            console.error('Failed to save offline cart:', error);
        }
    },

    load() {
        try {
            const stored = localStorage.getItem(OFFLINE_CART_KEY);
            if (!stored) return null;

            const { cart, timestamp } = JSON.parse(stored);

            // Cart expires after 7 days
            const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - timestamp > MAX_AGE) {
                this.clear();
                return null;
            }

            return cart;
        } catch (error) {
            console.error('Failed to load offline cart:', error);
            return null;
        }
    },

    clear() {
        localStorage.removeItem(OFFLINE_CART_KEY);
    },

    sync() {
        const cart = this.load();
        if (cart && navigator.onLine) {
            offlineQueue.addToQueue('cart_update', cart);
        }
    },
};
