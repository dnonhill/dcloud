import crypto from "crypto"
import fs from "fs"
import path from "path"
import process from "process"

const CONFIG_MODULE_PATH = "CONFIG_MODULE_PATH"
const DEFAULT_ENV = "default"

function defaultModulePath() {
  return path.join(process.cwd(), "src", "config")
}

function environmentCliArgs() {
  const cliArgs = process.argv.slice(2)
  return cliArgs.length > 0 ? cliArgs[0] : null
}

function relativePath(fullPath: string, relative: string) {
  const pos = fullPath.indexOf(relative)
  if (pos >= 0) {
    return fullPath.substr(pos + relative.length)
  }
  return fullPath
}

function moduleRelPath(fullPath: string) {
  return relativePath(fullPath, configModulePath)
}

function checksum(path: string) {
  const data = fs.readFileSync(path)
  const hex = crypto
    .createHash("md5")
    .update(data.toString("utf8"), "utf8")
    .digest("hex")
  return hex
}

const configModulePath = process.env[CONFIG_MODULE_PATH] || defaultModulePath()

const envArg = environmentCliArgs()
const runtimeEnv = envArg || process.env["NODE_ENV"] || DEFAULT_ENV

const moduleEnvPath = path.join(configModulePath, "index.ts")
const runtimeEnvPath = path.join(
  configModulePath,
  runtimeEnv.endsWith(".ts") ? runtimeEnv : runtimeEnv + ".ts"
)

const runtimeEnvExists = fs.existsSync(runtimeEnvPath)
const moduleEnvExists = fs.existsSync(moduleEnvPath)

if (!runtimeEnvExists) {
  console.error(
    `Enviornment "${runtimeEnv}" configuration not found.
Check if ${runtimeEnvPath} file exists`
  )
  process.exit(1)
}

console.info(`Configuring for ${runtimeEnv} environment`)

let replacement = true
const checkDiff = moduleEnvExists && runtimeEnvExists
if (checkDiff) {
  const different = checksum(moduleEnvPath) !== checksum(runtimeEnvPath)
  replacement = different
  if (different) {
    console.info("Different in current and target environment")
  }
}

if (runtimeEnvExists && replacement) {
  fs.copyFileSync(runtimeEnvPath, moduleEnvPath)
  console.info(
    `Replace ${path.basename(runtimeEnvPath)} with ${path.basename(
      moduleEnvPath
    )}`
  )
}
