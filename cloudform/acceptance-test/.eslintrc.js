module.exports = {
  settings: {react: {version: "detect"}},
  extends: ["react-app"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: 'module',
    project: './tsconfig.json',
    extraFileExtensions: ['.tsx'],
  },
  rules: {
    "indent": ["warn", 2, {SwitchCase: 1}],
    "quotes": ["warn", "double"],
    "semi": ["warn", "never"]
  }
};
