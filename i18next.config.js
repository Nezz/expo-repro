import { defineConfig } from "i18next-cli";

export default defineConfig({
  locales: ["en"],
  extract: {
    input: ["src/**/*.jsx"],
    output: "locales/{{language}}.json",
  },
});
