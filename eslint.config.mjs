import coreWebVitals from "eslint-config-next/core-web-vitals";

const base = Array.isArray(coreWebVitals) ? coreWebVitals : [coreWebVitals];

export default [
  ...base,
  {
    ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"],
  },
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
];
