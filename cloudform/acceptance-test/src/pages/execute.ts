import {BasePage} from "../browser/base-page"
import {ElementHandle} from "puppeteer"

const MY_TASK_URLS = "my-assignments"

export class MyTasksPage extends BasePage {
  async visit() {
    const currentUrl = this.page.url()
    if (!currentUrl.includes(MY_TASK_URLS)) {
      const myTasksMenu = await this.page.waitForSelector('[data-menu="MY TASKS"]')
      await Promise.all([
        myTasksMenu.click(),
        this.page.waitForNavigation()
      ])
    }
  }

  async viewTicket(ticketNo: string) {
    await this.page.waitForSelector(".assignment-items")
    this.clickLink(".assignment-items a strong", ticketNo)
    return this.continue(TicketTaskPage)
  }
}


export class TicketTaskPage extends BasePage {
  async getTaskGroups() {
    await this.page.waitForSelector(".task-group")
    return this.page.$$eval(
      ".task-group",
        el => el.map(x => ({
            id: x.getAttribute("data-id"),
            resourceName: (x.getElementsByClassName("resource-name")[0].textContent || "").trim(),
            isCompleted: x.getElementsByClassName("completed").length > 0
          })
        )
    )
  }

  async goToTaskGroup(taskGroupId: string) {
    const selector = `.task-group[data-id="${taskGroupId}"]`
    const taskGroupRow = await this.page.waitForSelector(selector)

    const link = await taskGroupRow.$('a')
    link!.click()
    return this.continue(TicketItemTaskPage)
  }

  async closeTicket() {
    const closeButton = await this.page.waitForSelector('[data-action="close-ticket"]')
    await closeButton.click()

    const confirmButton = await this.page.waitForSelector('[data-action="submit-close"]')
    confirmButton.click()

    return await this.continue(MyTasksPage)
  }
}


export class TicketItemTaskPage extends BasePage {
  async completeAllTasks() {
    const taskElements = await this.getTaskElements()
    const executions = taskElements.map(async (task) => {
      const status = await task.$eval('[data-field="completeState"]', e => e.getAttribute("data-value"))
      const currentId = await task.evaluate(e => e.getAttribute("data-id"))

      if (status === "incomplete") {
        await (await task.$('[data-field="completeState"]'))!.click()
        return this.page.waitForSelector(`.task[data-id="${currentId}"] [data-field="completeState"][data-value="completed"]`)
      }
    })

    await Promise.all(executions)
  }

  async getTaskElements (): Promise<ElementHandle[]> {
    const selector = ".task"
    await this.page.waitForSelector(selector)
    return await this.page.$$(selector)
  }

  async hasCompleteButton() {
    const completeButton = await this.page.$('[data-action="markComplete"]')
    return !!completeButton
  }

  async markComplete() {
    const selector = '[data-action="markComplete"]'
    const completeButton = await this.page.waitForSelector(selector)
    await completeButton!.click()
  }
}


export class TaskResultPage extends BasePage {
  async fillResult(results: any) {
    for (let key of Object.keys(results)) {
      const value = results[key]
      await this.inputField(key, value)
    }
  }

  async save() {
    const saveButton = await this.page.waitForSelector('[data-action="save"]')
    saveButton.click()
    return this.continue(TicketTaskPage)
  }
}