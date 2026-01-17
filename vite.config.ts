import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // World App内での動作を考慮したベースパス設定
  base: './',
  build: {
    // チャンクサイズの警告制限を設定（500KB）
    chunkSizeWarningLimit: 500,
    // アセットを相対パスで出力（World App内での動作を保証）
    assetsDir: 'assets',
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
