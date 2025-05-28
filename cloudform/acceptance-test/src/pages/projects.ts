import {BasePage} from "../browser/base-page"
import {ApplicationResourcePage, CreateApplicationPage} from "./applications"


const LIST_PROJECTS_URL = "/projects"

export class ListProjectPage extends BasePage {
  async visit() {
    const currentUrl = this.page.url()
    if (!currentUrl.endsWith(LIST_PROJECTS_URL)) {
      const myProjectMenu = await this.page.waitForSelector('[data-menu="MY PROJECTS"]')
      await Promise.all([
        myProjectMenu.click(),
        this.page.waitForNavigation()
      ])
    }
  }

  async goToCreateProject() {
    const newProjectButton = await this.page.waitForSelector('[data-action="new-project"]')
    newProjectButton.click()
    return await this.continue(CreateProjectPage)
  }

  async viewProject(projectName: string) {
    await this.page.waitForSelector('div.project-items')
    const projectLinks = await this.page.$$('.project-item a')

    for (let projectLink of projectLinks) {
      const linkContent = await projectLink.evaluate(e => e.textContent)
      if (linkContent === projectName) {
        projectLink.click()
        return this.continue(ViewProjectPage)
      }
    }

    throw new Error(`Project ${projectName} is not found.`)
  }

  async searchProject(name: string) {
    await this.page.type('form[data-form="search"] input[name="search-keyword"]', name)
  }
}

export class CreateProjectPage extends BasePage {
  async enterJobCode(jobCode: string) {
    await this.page!.type('input[name="jobCode"]', jobCode)
  }

  async enterProjectName(projectName: string) {
    await this.page!.type('input[name="name"]', projectName)
  }

  async createProject() {
    this.page.click('button[type="submit"]')
    return await this.continue(ViewProjectPage)
  }
}

export class ViewProjectPage extends BasePage {
  async getProjectName() {
    return await this.readField('projectName')
  }

  async getJobCode() {
    return await this.readField('jobCode')
  }

  async getExpiredDate() {
    return await this.readField('expiredDate')
  }

  async viewApplication(applicationName: string) {
    await this.page.waitForSelector(".application-items")
    const appLinks = await this.page.$$('.application-item a')

    for (let appLink of appLinks) {
      const linkContent = await appLink.evaluate(e => e.textContent)
      if (linkContent === applicationName) {
        appLink.click()
        return this.continue(ApplicationResourcePage)
      }
    }

    throw new Error(`Project ${applicationName} is not found.`)
  }

  async gotoNewApplication() {
    const newAppButton = await this.page.waitForSelector('[data-action="new-application"]')
    newAppButton.click()
    return this.continue(CreateApplicationPage)
  }
}
