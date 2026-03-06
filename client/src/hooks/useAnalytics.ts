export const useAnalytics = () => {
    const trackEvent = (action: string, params?: Record<string, any>) => {
        if (typeof window !== "undefined" && window.gtag) {
            window.gtag("event", action, params);
        }
    };

    return { trackEvent };
};
