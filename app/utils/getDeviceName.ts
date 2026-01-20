export function getDeviceName(): string {
    if (typeof navigator === "undefined") return "Unknown Device";

    const platform = navigator.platform;
    const userAgent = navigator.userAgent;

    // iOS devices
    if (/iPhone/.test(userAgent)) {
        // Try to detect iPhone model
        const screenHeight = window.screen.height;
        const screenWidth = window.screen.width;

        if (screenHeight === 926 || screenWidth === 926) return "iPhone 14 Pro Max";
        if (screenHeight === 844 || screenWidth === 844) return "iPhone 14 Pro";
        if (screenHeight === 812 || screenWidth === 812) return "iPhone 13/12";
        
        return "iPhone";
    }

    if (/iPad/.test(userAgent)) {
        if (/iPad Pro/.test(userAgent)) return "iPad Pro";
        if (/iPad Air/.test(userAgent)) return "iPad Air";
        return "iPad";
    }

    // macOS
    if (/Mac/.test(platform)) {
        if (/Macintosh/.test(userAgent)) {
            // Try to detect Mac type
            if (navigator.maxTouchPoints > 0) return "MacBook Air/Pro (M1/M2)";
            return "MacBook";
        }
        return "Mac";
    }

    // Windows
    if (/Win/.test(platform)) {
        if (/Win64/.test(userAgent) || /WOW64/.test(userAgent)) {
            return "Windows PC (64-bit)";
        }
        return "Windows PC";
    }

    // Android
    if (/Android/.test(userAgent)) {
        // Try to extract device model
        const match = userAgent.match(/Android.*;\s*([^)]+)\s*Build/);
        if (match && match[1]) {
            const model = match[1].trim();
            
            // Clean up common manufacturer prefixes
            if (model.includes("Samsung")) return "Samsung " + model.split(" ")[1];
            if (model.includes("Google")) return "Google Pixel";
            if (model.includes("OnePlus")) return "OnePlus";
            
            return model;
        }
        return "Android Device";
    }

    // Linux
    if (/Linux/.test(platform)) {
        if (/CrOS/.test(userAgent)) return "Chromebook";
        return "Linux PC";
    }

    // Fallback to browser info
    if (/Chrome/.test(userAgent) && !/Edge/.test(userAgent)) return "Chrome Browser";
    if (/Firefox/.test(userAgent)) return "Firefox Browser";
    if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return "Safari Browser";
    if (/Edge/.test(userAgent)) return "Edge Browser";

    return "Unknown Device";
}

export function getDeviceIcon(): string {
    const deviceName = getDeviceName();

    if (deviceName.includes("iPhone")) return "📱";
    if (deviceName.includes("iPad")) return "📱";
    if (deviceName.includes("Mac")) return "💻";
    if (deviceName.includes("Windows")) return "🖥️";
    if (deviceName.includes("Android")) return "📱";
    if (deviceName.includes("Linux")) return "🐧";
    if (deviceName.includes("Chromebook")) return "💻";

    return "📟";
}