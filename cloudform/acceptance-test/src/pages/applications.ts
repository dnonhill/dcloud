import { BasePage } from '../browser/base-page'
import {TicketDataCenterPage} from "./ticket"


interface CreateApplicationFields {
  name: string,
  description: string,
  supporterName: string,
  supporterEmail: string,
  supporterDepartment: string,
  supporterOrganization: string
}

export class CreateApplicationPage extends BasePage {
  async fillForm(values: CreateApplicationFields) {
    await this.inputField("name", values.name)
    await this.inputField("description", values.description)
    await this.inputField("supporterName", values.supporterName)
    await this.inputField("supporterEmail", values.supporterEmail)
    await this.inputField("supporterDepartment", values.supporterDepartment)
    await this.inputField("supporterOrganization", values.supporterOrganization)
  }

  async submit() {
    this.page.click('button[type="submit"]')
    return this.continue(ApplicationInfoPage)
  }
}


export class ApplicationInfoPage extends BasePage {
  async getApplicationName() {
    return await this.readField("name")
  }

  async getProjectName() {
    return await this.readField("project-name")
  }

  async getDescription() {
    return await this.readField("description")
  }

  async getSupporterName() {
    return await this.readField("supporterName")
  }

  async getSupporterEmail() {
    return await this.readField("supporterEmail")
  }

  async getSupporterDepartment() {
    return await this.readField("supporterDepartment")
  }

  async getSupporterOrganization() {
    return await this.readField("supporterOrganization")
  }
}

export class ApplicationResourcePage extends BasePage {
  async gotoNewTicket() {
    const newTicketButton = await this.page.waitForSelector('[data-action="new-ticket"]')
    await newTicketButton.click()

    return await this.continue(TicketDataCenterPage)
  }

  async searchResource(resourceName: string) {
    const searchField = await this.page.waitForSelector('[name="search-keyword"]')
    await searchField.click({clickCount: 3})
    await this.page.keyboard.press("Backspace")
    await searchField.type(resourceName)

    await this.page.click('[data-action="search"]')
    await this.page.waitFor(2000)
  }

  async getResources() {
    return await this.page.$$eval(
      '[data-field="resource-name"]',
        es => es.map(e => e.textContent)
    )
  }
}