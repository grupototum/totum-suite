import React from "react";

/**
 * totum brand mark.
 * size: "sm" | "md" | "lg"
 * variant:
 *   - "logo": just the square mark icon (cropped to first letter "t")
 *   - "wordmark": text-only "totum." rendered with display font
 *   - "full": full image of the totum logo at correct aspect ratio
 */
export default function Brand({ size = "md", variant = "full", className = "" }) {
    const sizes = {
        sm: { box: "h-7", text: "text-base" },
        md: { box: "h-9", text: "text-lg" },
        lg: { box: "h-12", text: "text-2xl" },
    };
    const s = sizes[size] || sizes.md;

    if (variant === "wordmark") {
        return (
            <span
                className={`font-display ${s.text} tracking-tight text-[var(--mp-primary)] ${className}`}
                data-testid="brand-wordmark"
            >
                totum<span className="text-[var(--mp-text)]">.</span>
            </span>
        );
    }

    if (variant === "logo") {
        return (
            <div
                className={`inline-flex items-center justify-center bg-black border border-black ${s.box} aspect-square overflow-hidden ${className}`}
                data-testid="brand-logo"
            >
                <img src="/logo.png" alt="totum" className="h-full w-auto" />
            </div>
        );
    }

    // "full" — black panel containing the wordmark image at correct aspect ratio
    return (
        <div
            className={`inline-flex items-center bg-black border border-black px-3 py-1.5 ${className}`}
            data-testid="brand"
        >
            <img src="/logo.png" alt="totum" className={`${s.box} w-auto`} style={{ objectFit: "contain" }} />
        </div>
    );
}
