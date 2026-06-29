import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    // Backend targets are read from the environment so the project is portable.
    // Set VITE_BACKEND_URL in a .env file to point at a backend on another port.
    const env = loadEnv(mode, process.cwd(), '')
    const backend = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'
    const iot = env.VITE_IOT_URL || 'http://127.0.0.1:8001'

    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        // In dev (`vite`/`serve`) the SPA is served from the root, so React Router
        // routes like "/" and "/login" match. In a production build Django serves
        // the bundle from /static/, so emit asset URLs with that prefix.
        base: command === 'serve' ? '/' : '/static/',
        build: {
            outDir: 'dist',
            emptyOutDir: true,
            manifest: true,
            rollupOptions: {
                output: {
                    entryFileNames: 'assets/[name].[hash].js',
                    chunkFileNames: 'assets/[name].[hash].js',
                    assetFileNames: 'assets/[name].[hash].[ext]'
                }
            }
        },
        server: {
            port: 5173,
            proxy: {
                '/api': { target: backend, changeOrigin: true },
                '/media': { target: backend, changeOrigin: true },
                '/iot': {
                    target: iot,
                    changeOrigin: true,
                    rewrite: (p) => p.replace(/^\/iot/, '/api'),
                },
            },
        },
    }
})
