import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/outpass/",   // MUST match your repo name

  plugins: [react()],

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-core': ['@mui/material', '@mui/icons-material'],
          'mui-date': ['@mui/x-date-pickers', '@mui/x-date-pickers/AdapterDateFns'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'forms': ['formik', 'yup'],
          'utils': ['date-fns', 'lodash-es']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})