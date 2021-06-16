const production = !process.env.ROLLUP_WATCH;

module.exports = {
  future: {
    purgeLayersByDefault: true,
    removeDeprecatedGapUtilities: true,
  },
  purge: {
    content: [
      "./src/**/*.svelte",
    ], 
    enabled: production
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
    minHeight: {
      '0': '0',
      '5': '1.25rem',
      'full': '100%',
      'screen': '100vh'
     }
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('tailwindcss-elevation')(['responsive', 'hover', 'active']),
  ],
}
