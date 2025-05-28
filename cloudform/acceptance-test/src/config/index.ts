import {PageConfiguration} from "./type"
import openshiftConfig from "./openshift"
import defaultConfig from "./default"

function getConfig(): PageConfiguration {
  const env = process.env.NODE_ENV || "developement"
  switch(env) {
    case "openshift":
      return openshiftConfig
    default:
      return defaultConfig
  }
}

export const config = getConfig()
