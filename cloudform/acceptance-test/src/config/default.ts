import {PageConfiguration} from "./type"

const defaultConfig: PageConfiguration = {
  baseUrl: "http://localhost:3000",
  stepDefinitionTimeout: 70000,
  navigationTimeout: 5000,
  selectorTimeout: 5000,
  headless: false,
  slowMo: 2
}

export default defaultConfig
