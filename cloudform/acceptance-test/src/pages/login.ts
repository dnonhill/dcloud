import {BasePage} from "../browser/base-page"


export class LoginPage extends BasePage {
  async visit() {
    await this.goto("/login/ptt")

    // If cannot access the log-in, try to log out before
    if (!this.page.url().includes('/login')) {
      await this.clickLogout()
    }
  }

  async enterUsername(username: string) {
    await this.page.type('input[name="username"]', username)
  }

  async enterPassword(password: string) {
    await this.page.type('input[name="password"]', password)
  }

  async selectDomain(domain: string) {
    await this.page.waitForSelector(`option[value="${domain}"]`)
    await this.page.select('select[name="domain"]', domain)
  }

  async clickLogin() {
    await this.page.click('button[type="submit"]')
  }

  async clickLogout() {
    await this.page.click('[data-menu="user"]')
    await Promise.all([
      this.page.click('[data-action="logout"]'),
      this.continue(LoginPage)
    ])
  }

  async login(domain: string, username: string, password: string) {
    await this.visit()
    await this.selectDomain(domain)
    await this.enterUsername(username)
    await this.enterPassword(password)
    await this.clickLogin()
  }
}
