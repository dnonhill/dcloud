import {randomSuffix} from "./util"
import Requestor, {TicketBuilder} from "./actor/requestor"
import Approver from "./actor/approver"
import CloudAdmin from "./actor/cloud-admin"
import Operator from "./actor/operator"

describe("Ticket journey of openshift machine", () => {
  let project = "PTTEP-e-Payment"
  let application = "Intelligent field development planning"

  let openshiftName = "openshift-" + randomSuffix()

  let approverName = "Lertwut Khan"
  let assigneeName = "Kajornthep Pi"

  let dataCenter = "5"
  let jobCode = "901481002036"

  let requestor: Requestor | undefined
  let approver: Approver | undefined
  let cloudAdmin: CloudAdmin | undefined
  let operator: Operator | undefined

  let ticketNo: string


  it("Create new resources", async () => {
    requestor = await Requestor.init()
    ticketNo = await requestor.createTicket(
      new TicketBuilder()
        .withProject(project)
        .withApplication(application)
        .withDataCenter(dataCenter)
        .withJobCode(jobCode)
        .addCreateOpenshift({
          namespace: openshiftName,
          cpu: "4",
          memory: "16",
          mainStorage: "100",
          "members[0]": "tansinee",
        })
        .withApprover(approverName)
        .ticket
    )
    console.log("Ticket for new resource", ticketNo)

    approver = await Approver.init()
    await approver.approveTicket(ticketNo)

    cloudAdmin = await CloudAdmin.init()
    await cloudAdmin.dispatchTicket(ticketNo, assigneeName)

    operator = await Operator.init()
    await operator.executeTicket(ticketNo, {
      [openshiftName]: {
        namespace: openshiftName,
        projectUrl: "http://dcloud-testserver.com/" + openshiftName,
      }
    })

    await requestor.findResources(project, application, [openshiftName])
  })

  it("Update existing resources", async () => {
    requestor = await Requestor.init()
    ticketNo = await requestor.createTicket(
      new TicketBuilder()
        .withProject(project)
        .withApplication(application)
        .withDataCenter(dataCenter)
        .withJobCode(jobCode)
        .addUpdateOpenshift(openshiftName, {
          memory: "8"
        })
        .withApprover(approverName)
        .ticket
    )

    console.log("Ticket for update", ticketNo)

    approver = await Approver.init()
    await approver.approveTicket(ticketNo)

    cloudAdmin = await CloudAdmin.init()
    await cloudAdmin.dispatchTicket(ticketNo, assigneeName)

    operator = await Operator.init()
    await operator.executeTicket(ticketNo, {
      [openshiftName]: {
        namespace: openshiftName,
        projectUrl: "http://dcloud-testserver.com/" + openshiftName,
      }
    })

    await requestor.findResources(project, application, [openshiftName])
  })

  it("Dismiss existing resources", async () => {
    requestor = await Requestor.init()
    ticketNo = await requestor.createTicket(
      new TicketBuilder()
        .withProject(project)
        .withApplication(application)
        .withDataCenter(dataCenter)
        .withJobCode(jobCode)
        .addDismissOpenshift(openshiftName)
        .withApprover(approverName)
        .ticket
    )

    console.log("Ticket for delete", ticketNo)

    approver = await Approver.init()
    await approver.approveTicket(ticketNo)

    cloudAdmin = await CloudAdmin.init()
    await cloudAdmin.dispatchTicket(ticketNo, assigneeName)

    operator = await Operator.init()
    await operator.executeTicket(ticketNo, {})

    await requestor.cannotFindResources(project, application, [openshiftName])
  })


  afterEach(async () => {
    if (requestor) {
      await requestor.done()
      requestor = undefined
    }
    if (approver) {
      await approver.done()
      approver = undefined
    }
    if (cloudAdmin) {
      await cloudAdmin.done()
      cloudAdmin = undefined
    }

    if (operator) {
      await operator.done()
      operator = undefined
    }

  })
})
