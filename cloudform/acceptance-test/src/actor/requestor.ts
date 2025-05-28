import {DCloudUser} from "./base"
import {ListProjectPage} from "../pages/projects"
import {TicketItem} from "../pages/ticket"

interface ProjectParams {
  name: string,
  jobCode: string
}

interface ApplicationParams {
  project: string,
  name: string,
  description: string,
  supporterName: string,
  supporterEmail: string,
  supporterDepartment: string,
  supporterOrganization: string
}



interface TicketParams {
  project: string,
  application: string,
  dataCenter: string
  jobCode: string
  approver: string
  items: TicketItem[]
}


class Requestor extends DCloudUser {
  static init(domain: string = "ptt", username: string = "req001", password: string = "roongroong") {
    return DCloudUser._init(Requestor, domain, username, password)
  }

  async createProject(projectInfo: ProjectParams) {
    const listProjectPage = this.generatePage(ListProjectPage)
    await listProjectPage.visit()
    const createProjectPage = await listProjectPage.goToCreateProject()

    await createProjectPage.enterJobCode(projectInfo.jobCode)
    await createProjectPage.enterProjectName(projectInfo.name)
    const viewProjectPage = await createProjectPage.createProject()

    return {
      name: await viewProjectPage.getProjectName(),
      jobCode: await viewProjectPage.getJobCode()
    }
  }

  async createApplication(appInfo: ApplicationParams) {
    const listProjectPage = this.generatePage(ListProjectPage)
    await listProjectPage.visit()
    await listProjectPage.searchProject(appInfo.project)
    const projectPage = await listProjectPage.viewProject(appInfo.project)
    const createAppPage = await projectPage.gotoNewApplication()

    await createAppPage.fillForm(appInfo)
    const appInfoPage = await createAppPage.submit()

    return {
      project: await appInfoPage.getProjectName(),
      name: await appInfoPage.getApplicationName(),
      description: await appInfoPage.getDescription(),
      supporterName: await appInfoPage.getSupporterName(),
      supporterEmail: await appInfoPage.getSupporterEmail(),
      supporterDepartment: await appInfoPage.getSupporterDepartment(),
      supporterOrganization: await appInfoPage.getSupporterOrganization(),
    }
  }

  async createTicket(ticketInfo: TicketParams) {
    const applicationPage = await this._goTo(ticketInfo.project, ticketInfo.application)

    const dataCenterStep = await applicationPage.gotoNewTicket()
    await dataCenterStep.enterForm(ticketInfo.dataCenter, ticketInfo.jobCode)
    const itemStep = await dataCenterStep.submit()

    for (let item of ticketInfo.items) {
      await itemStep.applyTicketItem(item)
    }

    const approverStep = await itemStep.submit()
    await approverStep.selectApprover(ticketInfo.approver)
    const confirmStep = await approverStep.submit()
    const donePage = await confirmStep.confirm()

    return await donePage.getTicketNo()
  }

  async findResources(project: string, application: string, resources: string[]) {
    const applicationPage = await this._goTo(project, application)

    for (let resource of resources) {
      await applicationPage.searchResource(resource)
      const resources  = await applicationPage.getResources()
      expect(resources).toContain(resource)
    }
  }

  async cannotFindResources(project: string, application: string, resources: string[]) {
    const applicationPage = await this._goTo(project, application)

    for (let resource of resources) {
      await applicationPage.searchResource(resource)
      const resources  = await applicationPage.getResources()
      expect(resources).not.toContain(resources)
    }
  }

  async _goTo(project: string, application: string) {
    const listProjectPage = this.generatePage(ListProjectPage)
    await listProjectPage.visit()
    await listProjectPage.searchProject(project)

    const projectPage = await listProjectPage.viewProject(project)
    return await projectPage.viewApplication(application)
  }
}


export class TicketBuilder {
  ticket: TicketParams = {
    project: "",
    application: "",
    dataCenter: "",
    jobCode: "",
    approver: "",
    items: []
  }

  withProject(project: string) {
    this.ticket.project = project
    return this
  }

  withApplication(application: string) {
    this.ticket.application = application
    return this
  }

  withDataCenter(dataCenter: string) {
    this.ticket.dataCenter = dataCenter
    return this
  }

  withJobCode(jobCode: string) {
    this.ticket.jobCode = jobCode
    return this
  }

  withApprover(approver: string) {
    this.ticket.approver = approver
    return this
  }

  addCreateVm(spec: any) {
    this.ticket.items.push({
      action: "create",
      resourceType: "vm",
      spec: spec
    })
    return this
  }

  addCreateOpenshift(spec: any) {
    this.ticket.items.push({
      action: "create",
      resourceType: "container-cluster",
      spec: spec
    })
    return this
  }

  addCreateOther(spec: any) {
    this.ticket.items.push({
      action: "create",
      resourceType: "other",
      spec: spec
    })
    return this
  }

  addUpdateVm(resourceName: string, spec: any) {
    this.ticket.items.push({
      action: "update",
      resourceType: "vm",
      resourceName: resourceName,
      spec: spec,
    })

    return this
  }

  addUpdateOpenshift(resourceName: string, spec: any) {
    this.ticket.items.push({
      action: "update",
      resourceType: "container-cluster",
      resourceName: resourceName,
      spec: spec,
    })

    return this
  }

  addDismissVm(resourceName: string) {
    this.ticket.items.push({
      action: "dismiss",
      resourceType: "vm",
      resourceName: resourceName,
      spec: {},
    })

    return this
  }

  addDismissOpenshift(resourceName: string) {
    this.ticket.items.push({
      action: "dismiss",
      resourceType: "container-cluster",
      resourceName: resourceName,
      spec: {},
    })

    return this
  }
}

export default Requestor
