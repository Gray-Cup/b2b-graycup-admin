module.exports = {
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@medusajs/ui/dist/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
}