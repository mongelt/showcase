import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cloudinaryCrop(url: string, w: number, h: number): string {
  if (!url || !url.includes('/image/upload/')) return url
  return url.replace('/image/upload/', `/image/upload/c_fill,w_${w},h_${h},q_auto,f_auto/`)
}

export function cloudinaryCropFit(url: string, w: number, h: number): string {
  if (!url || !url.includes('/image/upload/')) return url
  return url.replace('/image/upload/', `/image/upload/c_fit,w_${w},h_${h},q_auto,f_auto/`)
}

export function shuffleCopy<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

