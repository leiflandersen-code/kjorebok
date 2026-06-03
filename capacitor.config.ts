import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'no.kjorebok.app',
  appName: 'Kjørebok',
  webDir: 'out',
  server: {
    // Use live Vercel URL so the app always has fresh code
    url: 'https://kjorebok-gilt.vercel.app',
    cleartext: false,
  },
  ios: {
    backgroundColor: '#020617',
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    Geolocation: {
      // Required for background GPS on iOS
    },
  },
}

export default config
