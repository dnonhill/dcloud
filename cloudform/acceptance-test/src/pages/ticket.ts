import { BasePage } from "../browser/base-page"


export interface TicketItem {
  action: "create" | "update" | "dismiss"
  resourceType: "vm" | "container-cluster" | "other"
  resourceName?: string
  spec: any
}


export class TicketDataCenterPage extends BasePage {
  async enterForm(dataCenter: string, jobCode: string) {
    const dataCenterSelect = await this.page.waitForSelector('[name="dataCenter"]')
    await dataCenterSelect.select(dataCenter)
    await this.inputField("jobCode", jobCode)
  }

  async submit() {
    this.page.click('[data-action="proceed"]')
    return await this.continue(TicketItemsPage)
  }
}

export class TicketItemsPage extends BasePage {
  applyTicketItem = async (ticketItem: TicketItem) => {
    await this.page.waitFor(1000)

    if (ticketItem.action === "create") {
      await this.applyCreateResource(ticketItem)
    } else if (ticketItem.action === "update") {
      await this.applyUpdateResource(ticketItem)
    } else if (ticketItem.action === "dismiss") {
      await this.applyDismissResource(ticketItem)
    }
  }

  async submit() {
    this.page.click('[data-action="proceed"]')
    return await this.continue(TicketApproverPage)
  }

  async applyCreateResource(ticketItem: TicketItem) {
    await this.page.click(`[data-action="create-${ticketItem.resourceType}"]`)
    await this._applySpec(ticketItem.spec)
    await this.page.click('[data-action="save"]')
  }

  async applyUpdateResource(ticketItem: TicketItem) {
    await this.page.waitForSelector(".existing-resource")
    const resource = await this.findExistingResource(ticketItem.resourceName!)

    const toggleShowButton = await resource.$('[data-action="toggle-box"]')
    await toggleShowButton!.click()
    await this.page.waitFor(200)

    const updateButton = await resource.$('[data-action="update-resource"]')
    await updateButton!.click()

    await this._applySpec(ticketItem.spec)
    await this.page.click('[data-action="save"]')
  }

  async applyDismissResource(ticketItem: TicketItem) {
    await this.page.waitForSelector(".existing-resource")
    const resource = await this.findExistingResource(ticketItem.resourceName!)

    const toggleShowButton = await resource.$('[data-action="toggle-box"]')
    await toggleShowButton!.click()
    await this.page.waitFor(200)

    const updateButton = await resource.$('[data-action="dismiss-resource"]')
    await updateButton!.click()

  }

  async _applySpec(spec: any) {
    let environment = null
    if ("environment" in spec) {
      environment = spec.environment
      delete spec.environment
    }

    for (let field of Object.keys(spec)) {
      const value = spec[field]
      await this.inputField(field, value)
    }

    if (environment != null) {
      await this.page.click('[name="environment"]')
    }
  }

  async findExistingResource(name: string) {
    const resources = await this.page.$$(".existing-resource")
    for (let resource of resources) {
      const resourceName = await resource.$eval('.resource-name', e => e.textContent)
      if (resourceName === name)
        return resource
    }

    throw new Error(`Cannot find resource ${name}`)
  }
}

export class TicketApproverPage extends BasePage {

  async selectApprover(approver: string) {
    await this.page.waitForSelector(".approver")
    const approvers = await this.page.$$(".approver")
    for(let a of approvers) {
      const linkContent = await a.evaluate(e => e.textContent)
      if (linkContent === approver) {
        await a.click()
        return
      }
    }

    throw new Error(`No approver: ${approver} found`)
  }

  async submit() {
    this.page.click('[data-action="proceed"]')
    return await this.continue(TicketConfirmation)
  }
}

class TicketConfirmation extends BasePage {
  async confirm() {
    const confirmButton = await this.page.waitForSelector('[data-action="submit-request"]')
    confirmButton.click()
    return await this.continue(TicketResultPage)
  }
}

class TicketResultPage extends BasePage {
  async getTicketNo() {
    return this.readField("ticketNo")
  }
}


