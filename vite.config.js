import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.replace(/\\/g, '/');
          if (!moduleId.includes('/node_modules/')) return;

          if (moduleId.includes('/node_modules/three/') || moduleId.includes('/node_modules/@react-three/') || moduleId.includes('/node_modules/@tsparticles/')) {
            return 'vendor-graphics';
          }

          if (moduleId.includes('/node_modules/framer-motion/') || moduleId.includes('/node_modules/motion/')) {
            return 'vendor-motion';
          }

          if (moduleId.includes('/node_modules/lucide-react/') || moduleId.includes('/node_modules/@tabler/') || moduleId.includes('/node_modules/@radix-ui/')) {
            return 'vendor-ui';
          }

          if (moduleId.includes('/node_modules/react/') || moduleId.includes('/node_modules/react-dom/') || moduleId.includes('/node_modules/react-router-dom/')) {
            return 'vendor-react';
          }

          if (moduleId.includes('/node_modules/firebase/')) {
            return 'vendor-firebase';
          }

          if (moduleId.includes('/node_modules/jspdf-autotable/')) {
            return 'vendor-pdf-table';
          }

          if (moduleId.includes('/node_modules/jspdf/')) {
            return 'vendor-pdf';
          }

          if (moduleId.includes('/node_modules/html2canvas/')) {
            return 'vendor-canvas';
          }

          if (moduleId.includes('/node_modules/dompurify/')) {
            return 'vendor-sanitize';
          }

          if (moduleId.includes('/node_modules/date-fns/')) {
            return 'vendor-date';
          }

          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
