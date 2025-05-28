module.exports = {
  "roots": [
    "src"
  ],
  "testMatch": [
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  "transform": {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  "setupFilesAfterEnv": ["./src/jest.setup.ts"]
}
