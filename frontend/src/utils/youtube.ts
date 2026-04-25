/**
 * Extract YouTube video ID from a URL or bare 11-character ID.
 * Mirrors backend/src/utils/youtubeParser.ts behavior.
 */
export function extractYoutubeVideoId(url: string | undefined | null): string | null {
    if (url == null || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

    const regex =
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = trimmed.match(regex);
    return match?.[1] ?? null;
}

/** Build standard YouTube embed URL from a video ID */
export function getYoutubeEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Resolve a YouTube embed URL from a primary URL (watch/share/embed) and optional fallback ID field.
 */
export function getYoutubeEmbedSrc(
    primaryUrl: string | undefined | null,
    fallbackYoutubeVideoId?: string | undefined | null
): string | null {
    const fromUrl = extractYoutubeVideoId(primaryUrl || '');
    const fromFallback = extractYoutubeVideoId(fallbackYoutubeVideoId || '');
    const bare =
        fallbackYoutubeVideoId &&
        typeof fallbackYoutubeVideoId === 'string' &&
        /^[a-zA-Z0-9_-]{11}$/.test(fallbackYoutubeVideoId.trim())
            ? fallbackYoutubeVideoId.trim()
            : null;
    const id = fromUrl || fromFallback || bare;
    return id ? getYoutubeEmbedUrl(id) : null;
}

/** True when URL likely points to a direct browser-playable media file */
export function isLikelyDirectVideoFileUrl(url: string | undefined | null): boolean {
    if (!url || typeof url !== 'string') return false;
    if (!/^https?:\/\//i.test(url.trim())) return false;
    const path = url.trim().split(/[?#]/)[0].toLowerCase();
    return /\.(mp4|webm|ogg|ogv|mov)(\b|$)/.test(path);
}
