import {BasePage} from "../browser/base-page"
import {Dialog} from "puppeteer"


const APPROVEMENTS_URL = "approvements"

export class ListApprovementPage extends BasePage {
  async visit() {
    const currentUrl = this.page.url()
    if (!currentUrl.includes(APPROVEMENTS_URL)) {
      const approvementMenu = await this.page.waitForSelector('[data-menu="APPROVEMENTS"]')
      await Promise.all([
        approvementMenu.click(),
        this.page.waitForNavigation()
      ])
    }
  }

  async goToApprovementTicket(ticketNo: string) {
    await this.page.waitForSelector(".approvement-items")
    this.clickLink(".approvement-items a", ticketNo)
    return this.continue(ViewApprovementPage)
  }

  async goToStatus(status: string) {
    const statusButton = await this.page.waitForSelector(`[data-sub-menu="${status}"]`)
    await statusButton.click()
    await this.page.waitFor(2000)
  }

  async assertHasTicket(ticketNo: string) {
    await this.inputField("search-keyword", ticketNo)
    await this.page.click('[data-action="search"]')

    await this.page.waitFor(2000)
    const itemElements = await this.page.$$('.approvement-item [data-field="ticket-no"]')
    const ticketNumbers = await Promise.all(
      itemElements.map(element => element.evaluate(e => e.textContent, element))
    )

    expect(ticketNumbers).toContain(ticketNo.trim())
  }
}

export class ViewApprovementPage extends BasePage {
  async approve() {
    const approveButton = await this.page.waitForSelector('[data-action="approve"]')

    const confirmApproval = new Promise(resolve => {
      this.page.on("dialog", async (dialog: Dialog) => {
        await dialog.accept()
        resolve()
      })
    })

    await approveButton.click()
    await confirmApproval

    return await this.continue(ListApprovementPage)
  }

  async reject(reason: string) {
    const rejectButton = await this.page.waitForSelector('[data-action="reject"]')
    await rejectButton.click()
    await this.inputField("reason", reason)

    this.page.click('[data-action="submit-reject"]')
    return await this.continue(ListApprovementPage)
  }
}
