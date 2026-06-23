interface Window {
  esc(s: string): string;
  api(path: string, init?: RequestInit): Promise<unknown>;
}
