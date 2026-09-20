import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'

export default defineConfig({
  plugins: [
    RubyPlugin(),
  ],
  server: {
    // Pin the HMR host/port explicitly so the browser always dials back to
    // Vite's own dev server (port 3036), not the page's origin (Jekyll on
    // port 4000). Without `clientPort`, Vite infers the websocket target
    // from `location`, which picks up Jekyll's port here since Jekyll and
    // Vite run as separate, unproxied servers.
    hmr: {
      host: 'localhost',
      clientPort: 3036,
    },
  },
})
