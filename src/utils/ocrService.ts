import { OcrResult } from '../types';

export interface CropRegion {
  topPercent: number; // e.g. 68 for 68% down the frame
  bottomPercent: number; // e.g. 98 for near the bottom
}

/**
 * Capture a frame from an HTML5 video element with optional cropping
 * for the lower subtitle bar area.
 */
export function captureFrameFromVideo(
  video: HTMLVideoElement,
  cropRegion: CropRegion = { topPercent: 68, bottomPercent: 98 }
): { base64: string; dataUrl: string } | null {
  try {
    if (!video || video.readyState < 2) {
      console.warn('Video element not ready for frame capture');
      return null;
    }

    const vw = video.videoWidth || video.clientWidth || 640;
    const vh = video.videoHeight || video.clientHeight || 360;

    const cropTop = Math.max(0, Math.min(100, cropRegion.topPercent)) / 100;
    const cropBottom = Math.max(0, Math.min(100, cropRegion.bottomPercent)) / 100;

    const startY = Math.floor(vh * cropTop);
    const sliceHeight = Math.max(20, Math.floor(vh * (cropBottom - cropTop)));

    const canvas = document.createElement('canvas');
    canvas.width = vw;
    canvas.height = sliceHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw the subtitle region of the video frame
    ctx.drawImage(
      video,
      0,
      startY,
      vw,
      sliceHeight,
      0,
      0,
      vw,
      sliceHeight
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');

    return { base64, dataUrl };
  } catch (err) {
    console.error('Failed to capture video frame:', err);
    return null;
  }
}

/**
 * Send captured frame to OCR API endpoint
 */
export async function scanFrameOcr(
  imageBase64: string,
  timestamp: number,
  episodeTitle?: string
): Promise<OcrResult> {
  try {
    const res = await fetch('/api/ocr-frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        timestamp,
        episodeTitle,
      }),
    });

    if (!res.ok) {
      throw new Error(`OCR service failed with status ${res.status}`);
    }

    const data = await res.json();
    return {
      hasSubtitle: Boolean(data.hasSubtitle),
      mandarin: data.mandarin,
      english: data.english,
      taiwanNotes: data.taiwanNotes,
      characters: data.characters,
      timestamp: data.timestamp ?? timestamp,
      message: data.message,
      isUnavailable: data.isUnavailable,
    };
  } catch (err: any) {
    console.error('OCR scanning error:', err);
    return {
      hasSubtitle: false,
      timestamp,
      message: 'OCR service is currently unavailable. Please try again.',
      isUnavailable: true,
    };
  }
}
