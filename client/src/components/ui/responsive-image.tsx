import { useState } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    imageId: string;
    variant?: "public" | "thumb" | "hero";
    aspectRatio?: string; // e.g. "16/9"
    priority?: boolean;
    imageClassName?: string;
}

// The user didn't provide the Account Hash, only Account ID. Account Hash is different.
// The Account Hash is usually visible in the dashboard or in the upload response.
// Workaround: We will use a placeholder or ask the user, OR simpler:
// The upload response usually contains the full variants URLs or we can deduce it.
// Let's assume we can pass it via prop or ENV.
// For now, I'll put a PLACEHOLDER_HASH and ask user to update or fetch it from an env var.

const CLOUDFLARE_ACCOUNT_HASH = import.meta.env.VITE_CF_ACCOUNT_HASH || "BIvRyidbDBOIzzsESnsR5g";

export function ResponsiveImage({
    imageId,
    variant = "public",
    aspectRatio,
    priority = false,
    className,
    alt,
    imageClassName,
    ...props
}: ResponsiveImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    // Check if imageId is a legacy URL (http/https/relative)
    const isLegacy = imageId?.startsWith("http") || imageId?.startsWith("/");

    if (isLegacy) {
        return (
            <img
                src={imageId}
                alt={alt}
                className={cn("w-full h-full object-cover", imageClassName)}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                decoding="async"
                {...props}
            />
        );
    }

    // Cloudflare Image Delivery URL construction
    // We can use variants OR flexible resizing if enabled.
    // Flexible: /w=400,sharpen=1
    // Variants: /public, /thumb

    // Let's use flexible resizing for srcSet if we want true responsiveness,
    // but if the plan says "Variants: public, thumb", let's stick to that for simplicity first,
    // OR use flexible if available.

    // Base URL
    const baseUrl = `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}`;

    // const srcSet = `
    // ${baseUrl}/w=320,sharpen=1 320w,
    // ${baseUrl}/w=640,sharpen=1 640w,
    // ${baseUrl}/w=960,sharpen=1 960w,
    // ${baseUrl}/w=1280,sharpen=1 1280w
    // `;

    const src = `${baseUrl}/${variant}`; // Default fallback

    return (
        <div
            className={cn("relative overflow-hidden bg-secondary/20", className)}
            style={{ aspectRatio: aspectRatio }}
        >
            <img
                src={src}
                // srcSet={srcSet}
                // sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                alt={alt}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                decoding="async"
                onLoad={() => setIsLoaded(true)}
                onError={(e) => {
                    console.error("Image load error:", src);
                    setIsLoaded(true); // Show broken image icon at least
                }}
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-500",
                    isLoaded ? "opacity-100" : "opacity-100", // Force visible for debugging
                    imageClassName
                )}
                {...props}
            />

            {/* Blur Placeholder (optional, if we had a tiny blurhash or low-res variant) */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-secondary/30 animate-pulse" />
            )}
        </div>
    );
}
