export default {
  plugins:
    process.env.VITEST === "true"
      ? []
      : ["@tailwindcss/postcss"],
};
