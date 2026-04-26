import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  // https://www.youtube.com/watch?v=VIDEO_ID
  let match = url.match(/[?&]v=([^&#]+)/);
  if (match) return match[1];
  // https://youtu.be/VIDEO_ID
  match = url.match(/youtu\.be\/([^?&#]+)/);
  if (match) return match[1];
  // https://www.youtube.com/shorts/VIDEO_ID
  match = url.match(/youtube\.com\/shorts\/([^?&#]+)/);
  if (match) return match[1];
  return null;
}
