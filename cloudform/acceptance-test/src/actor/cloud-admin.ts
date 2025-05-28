import {DCloudUser} from "./base"
import {ToDispatchListPage} from "../pages/dispatch"



class CloudAdmin extends DCloudUser {
  static init(domain = "ptt", username = "cloud001", password = "roongroong") {
    return DCloudUser._init(CloudAdmin, domain, username, password)
  }

  async dispatchTicket(ticketNo: string, assignee: string) {
    let listPage = this.generatePage(ToDispatchListPage)
    await listPage.assertHasTickets()

    const viewPage = await listPage.viewTicket(ticketNo)
    await viewPage.assign(assignee)
  }
}

export default CloudAdmin