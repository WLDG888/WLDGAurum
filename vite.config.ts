import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // チャンクサイズの警告制限を設定（500KB）
    chunkSizeWarningLimit: 500,
    // コード分割の最適化
    rollupOptions: {
      output: {
        manualChunks: {
          // vendorチャンクに依存関係をまとめる
          'react-vendor': ['react', 'react-dom'],
          'ethers-vendor': ['ethers'],
          'worldcoin-vendor': ['@worldcoin/minikit-js'],
        },
      },
    },
  },
})
