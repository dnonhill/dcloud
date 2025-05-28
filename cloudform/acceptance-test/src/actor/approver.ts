import {DCloudUser} from "./base"
import {ListApprovementPage} from "../pages/approvement"

class Approver extends DCloudUser {
  static init(domain= "ptt", username = "aprv002", password = "roongroong") {
    return DCloudUser._init(Approver, domain, username, password)
  }

  async approveTicket(ticketNo: string) {
    let listPage = this.generatePage(ListApprovementPage)

    const viewPage = await listPage.goToApprovementTicket(ticketNo)
    listPage = await viewPage.approve()

    await listPage.goToStatus("Approved")
    await listPage.assertHasTicket(ticketNo)
  }
}

export default Approver