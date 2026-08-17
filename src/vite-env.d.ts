/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module 'gun' {
  export interface GunOptions {
    peers?: string[];
    localStorage?: boolean;
    radisk?: boolean;
  }

  export interface GunNode {
    get(key: string): GunNode;
    put(data: unknown, cb?: (ack: unknown) => void): GunNode;
    set(data: unknown, cb?: (ack: unknown) => void): GunNode;
    map(): GunNode;
    once(cb: (data: unknown, key: string) => void): GunNode;
    on(cb: (data: unknown, key: string) => void): GunNode;
    off(): void;
  }

  export default function Gun(options?: GunOptions | string[]): GunNode;
}
