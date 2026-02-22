import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React and core libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Material-UI core
          'mui-core': ['@mui/material', '@mui/icons-material'],
          // Material-UI date pickers
          'mui-date': ['@mui/x-date-pickers', '@mui/x-date-pickers/AdapterDateFns'],
          // Firebase
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Form libraries
          'forms': ['formik', 'yup'],
          // Utils
          'utils': ['date-fns', 'lodash-es']
        }
      }
    },
    chunkSizeWarningLimit: 600 // Increase warning limit to 600KB
  }
})
