/** Tailwind through PostCSS, so Turbopack and webpack builds process CSS the same way. */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
