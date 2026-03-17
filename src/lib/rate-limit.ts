type RateLimitOptions = {
    uniqueTokenPerInterval?: number;
    interval?: number;
};

export default function rateLimit(options?: RateLimitOptions) {
    const tokenCache = new Map<string, { count: number; timestamp: number }>();
    const interval = options?.interval || 60000; // 1 minute default
    const maxKeys = options?.uniqueTokenPerInterval || 500;

    return {
        check: (limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                const now = Date.now();
                
                // Cleanup old entries if we exceed maxKeys to prevent memory leaks
                if (tokenCache.size > maxKeys) {
                    for (const [key, value] of tokenCache.entries()) {
                        if (now - value.timestamp > interval) {
                            tokenCache.delete(key);
                        }
                    }
                }

                const record = tokenCache.get(token);

                if (!record || (now - record.timestamp > interval)) {
                    // First time or interval passed, reset
                    tokenCache.set(token, { count: 1, timestamp: now });
                    resolve();
                } else {
                    // Within interval
                    record.count += 1;
                    if (record.count > limit) {
                        reject("RATE_LIMITED");
                    } else {
                        resolve();
                    }
                }
            }),
    };
}
