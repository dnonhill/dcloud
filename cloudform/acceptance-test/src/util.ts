import crypto from "crypto"

export function randomSuffix() {
  return crypto.randomBytes(6).toString('hex')
}