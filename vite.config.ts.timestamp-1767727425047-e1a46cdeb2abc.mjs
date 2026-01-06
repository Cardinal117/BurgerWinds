// vite.config.ts
import { defineConfig } from "file:///E:/Backup/1.0%20WEB%20CREATIONS/Fullstack-apps/BurgerWinds/node_modules/vite/dist/node/index.js";
import react from "file:///E:/Backup/1.0%20WEB%20CREATIONS/Fullstack-apps/BurgerWinds/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/BurgerWinds/" : "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "vendor-react": ["react", "react-dom"],
          "vendor-charts": ["recharts"],
          "vendor-icons": ["lucide-react"]
        }
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxCYWNrdXBcXFxcMS4wIFdFQiBDUkVBVElPTlNcXFxcRnVsbHN0YWNrLWFwcHNcXFxcQnVyZ2VyV2luZHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXEJhY2t1cFxcXFwxLjAgV0VCIENSRUFUSU9OU1xcXFxGdWxsc3RhY2stYXBwc1xcXFxCdXJnZXJXaW5kc1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovQmFja3VwLzEuMCUyMFdFQiUyMENSRUFUSU9OUy9GdWxsc3RhY2stYXBwcy9CdXJnZXJXaW5kcy92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBjb21tYW5kIH0pID0+ICh7XHJcbiAgcGx1Z2luczogW3JlYWN0KCldLFxyXG4gIGJhc2U6IGNvbW1hbmQgPT09ICdidWlsZCcgPyAnL0J1cmdlcldpbmRzLycgOiAnLycsXHJcbiAgYnVpbGQ6IHtcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAvLyBWZW5kb3IgY2h1bmtzXHJcbiAgICAgICAgICAndmVuZG9yLXJlYWN0JzogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcclxuICAgICAgICAgICd2ZW5kb3ItY2hhcnRzJzogWydyZWNoYXJ0cyddLFxyXG4gICAgICAgICAgJ3ZlbmRvci1pY29ucyc6IFsnbHVjaWRlLXJlYWN0J11cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pKVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtXLFNBQVMsb0JBQW9CO0FBQy9YLE9BQU8sV0FBVztBQUVsQixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLFFBQVEsT0FBTztBQUFBLEVBQzVDLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixNQUFNLFlBQVksVUFBVSxrQkFBa0I7QUFBQSxFQUM5QyxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUE7QUFBQSxVQUVaLGdCQUFnQixDQUFDLFNBQVMsV0FBVztBQUFBLFVBQ3JDLGlCQUFpQixDQUFDLFVBQVU7QUFBQSxVQUM1QixnQkFBZ0IsQ0FBQyxjQUFjO0FBQUEsUUFDakM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
