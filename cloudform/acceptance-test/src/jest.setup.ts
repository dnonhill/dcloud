import {config} from "./config"

jest.setTimeout(config.stepDefinitionTimeout || 5_000)