import puppeteer from "puppeteer"

export interface Page {}
export type PageType<P extends Page> = {
  new(...args: any[]): P
}

export class BasePage {
  constructor(
    private baseUrl: string | undefined,
    protected pageHandle: puppeteer.Page
  ) {}

  get page() : puppeteer.Page {
    return this.pageHandle
  }

  async inputField(field: string, value: string) {
    const elem = await this.page.waitForSelector(`[name="${field}"]`)
    // Clear input first
    await elem.click({clickCount: 3})
    await this.page.keyboard.press("Backspace")

    // Input new value
    await elem.type(value)
  }

  async readField(field: string) {
    const elem = await this.page.waitForSelector(`[data-field="${field}"]`)
    const value = await elem.evaluate(e => e.textContent!.trim())

    return value
  }

  async continue<P extends BasePage>(pageCreator: PageType<P>) {
    await this.page.waitForNavigation()
    return new pageCreator(this.baseUrl, this.pageHandle)
  }

  async goto(url: string) {
    await this.page.goto((this.baseUrl || "/") + url)
  }

  async clickLink(selector: string, linkText: string) {
    const links = await this.page.$$(selector)
    for (let link of links) {
      const linkContent = await link.evaluate(e => e.textContent)
      if (linkContent!.trim() === linkText) {
        await link.click()
        return
      }
    }

    throw new Error(`Link ${linkText} of ${selector} not found.`)
  }
}