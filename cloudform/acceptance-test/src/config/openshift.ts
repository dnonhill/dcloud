import defaultConfig from "./default"

const openshiftConfig = {
  ...defaultConfig,
  baseUrl: "http://dcloud-uat.pttdigital.com:3000",
  headless: true,
  slowMo: 0
}

export default openshiftConfig
