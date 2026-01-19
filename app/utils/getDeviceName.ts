export function getDeviceName() {
    if (typeof navigator === "undefined") return "Unknown device";
    return navigator.platform.includes("Mac") ? "Mac" : "Device";
}
