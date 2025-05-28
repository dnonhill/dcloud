import {BasePage} from "../browser/base-page"

const DISPATCH_TICKET_URL = "assignments"

export class ToDispatchListPage extends BasePage {
  async visit() {
    const currentUrl = this.page.url()
    if (!currentUrl.endsWith(DISPATCH_TICKET_URL)) {
      const dispatchMenu = await this.page.waitForSelector('[data-menu="DISPATCH TICKET"]')
      await Promise.all([
        dispatchMenu.click(),
        this.page.waitForNavigation()
      ])
    }
  }

  async assertHasTickets() {
    await this.page.waitForSelector("section.ticket-items")
  }

  async viewTicket(ticketNo: string) {
    await this.page.waitForSelector("section.ticket-items")
    this.clickLink("section.ticket-items a", ticketNo)
    return await this.continue(DispatchTicketPage)
  }
}


export class DispatchTicketPage extends BasePage {
  async assign(assignee: string) {
    const assignButton = await this.page.waitForSelector('[data-action="assign"]')
    await assignButton.click()

    await this.page.waitForSelector(".operator")
    await this.clickLink("a.operator", assignee)

    this.page.click('[data-action="submit-assign"]')
    return await this.continue(ToDispatchListPage)
  }
}