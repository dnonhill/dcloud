import {DCloudUser} from "./base"
import {MyTasksPage, TaskResultPage} from "../pages/execute"



class Operator extends DCloudUser {
  static init(domain: string = "ptt", username: string = "admin001", password: string = "roongroong") {
    return DCloudUser._init(Operator, domain, username, password)
  }

  async executeTicket(ticketNo: string, results: any) {
    let listPage = this.generatePage(MyTasksPage)
    await listPage.visit()
    const ticketPage = await listPage.viewTicket(ticketNo)

    const taskGroups = await ticketPage.getTaskGroups()
    for (let taskGroup of taskGroups) {
      const tasksPage = await ticketPage.goToTaskGroup(taskGroup.id!)

      if (!taskGroup.isCompleted) {
        await tasksPage.completeAllTasks()
        await tasksPage.markComplete()

        if (taskGroup.resourceName in results) {
          const resultPage = this.generatePage(TaskResultPage)
          await resultPage.fillResult(results[taskGroup.resourceName])
          await resultPage.save()
        }
      } else {
        await tasksPage.getTaskElements()
        const hasCompleteButton = await tasksPage.hasCompleteButton()
        expect(hasCompleteButton).toBe(false)
        await tasksPage.page.goBack()
      }
    }

    await ticketPage.closeTicket()
  }
}

export default Operator