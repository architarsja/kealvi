// Generates + persists an anonymous fingerprint for this browser
export function getFingerprint(): string {
  if (typeof window === 'undefined') return 'server';
  let fp = localStorage.getItem('qa_fp');
  if (!fp) {
    fp = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('qa_fp', fp);
  }
  return fp;
}