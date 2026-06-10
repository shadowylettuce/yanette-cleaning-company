// postcss.config.mjs — tells the build system to run Tailwind CSS
// PostCSS is the tool that processes our CSS; Tailwind plugs into it.

const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // this plugin turns Tailwind class names into real CSS
  },
}

export default config // hand the config to the build system
