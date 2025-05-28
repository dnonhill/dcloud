import puppeteer from "puppeteer"

import pageFactory from "../browser/page-factory"
import {LoginPage} from "../pages/login"
import {config} from "../config"
import {BasePage, PageType} from "../browser/base-page"

export class BaseActor {
  constructor(
    protected baseUrl: string | undefined,
    protected pageHandle: puppeteer.Page
  ) {}

  async done() {
    await this.pageHandle.browser().close()
  }
}

export type ActorType<P extends BaseActor> = {
  new(...args: any[]): P
}

export class DCloudUser extends BaseActor {
  constructor(baseUrl: string | undefined, pageHandle: puppeteer.Page) {
    super(baseUrl, pageHandle)
  }

  static async _init<P extends DCloudUser>(
    actorType: ActorType<P>,
    domain: string,
    username: string,
    password: string
  ) {
    const pageHandle = await pageFactory.createPageHandle()
    const user = new actorType(config.baseUrl, pageHandle)
    await user.login(domain, username, password)

    return user
  }

  async login(domain: string, username: string, password: string) {
    const loginPage = new LoginPage(this.baseUrl, this.pageHandle)
    await loginPage.visit()
    await loginPage.login(domain, username, password)
  }

  generatePage<P extends BasePage>(pageType: PageType<P>) {
    return new pageType(this.baseUrl, this.pageHandle)
  }
}
