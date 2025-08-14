// Created: Initial Vite config for Phaser + Capacitor with relative base for Android assets.
import { defineConfig } from 'vite';
export default defineConfig({
    base: '',
    server: {
        host: true,
        port: 5173,
    },
    build: {
        target: 'esnext',
        sourcemap: false,
    },
});
