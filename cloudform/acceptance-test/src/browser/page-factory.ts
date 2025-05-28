import puppeteer from "puppeteer"

import {PageConfiguration} from "../config/type"
import {config} from "../config"

export class PageFactory {
  constructor(public config?: PageConfiguration) {
  }

  async createPageHandle(): Promise<puppeteer.Page> {
    const config = this.getConfiguration()
    const browser = await puppeteer.launch(config)
    const context = await browser.createIncognitoBrowserContext()
    const page = await context.newPage()
    page.setDefaultTimeout(config.timeout)
    page.setDefaultNavigationTimeout(config.timeout)

    return page
  }

  getConfiguration() {
    return {
      headless: this.config && this.config.headless,
      slowMo: (this.config && this.config.slowMo) || 3,
      timeout: (this.config && this.config.navigationTimeout) || 3000,
      defaultViewport: {
        width: 1280,
        height: 624,
        deviceScaleFactor: 1
      }
    }
  }
}

export default new PageFactory(config)
