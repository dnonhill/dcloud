module.exports = {
  settings: {
    react: {
      version: "detect"
    }
  },
  plugins: [
    "simple-import-sort"
  ],
  extends: [
    "react-app",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    ecmaFeatures: {
      jsx: true
    },
    sourceType: 'module',
    project: './tsconfig.json',
    extraFileExtensions: ['.tsx'],
  },
  rules: {
    "indent": "off",
    // "indent": ["warn", 2, {SwitchCase: 1}],
    "quotes": ["warn", "single"],
    "semi": ["warn", "always"],
    "react/prop-types": 0,
    "sort-imports": "off",
    "simple-import-sort/sort": "warn",
    "prettier/prettier": "warn",
  },
  "overrides": [
    {
      "files": "server/**/*.js",
      "env": { "node": true },
      "rules": {
        "simple-import-sort/sort": "off",
        "import/order": ["warn", { "newlines-between": "always" }]
      }
    }
  ]
};
