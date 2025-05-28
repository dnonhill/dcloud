import {randomSuffix} from "./util"
import Requestor, {TicketBuilder} from "./actor/requestor"
import Approver from "./actor/approver"
import CloudAdmin from "./actor/cloud-admin"
import Operator from "./actor/operator"


describe("Ticket journey of virtual machine", () => {
  let project = "PTTEP-e-Payment"
  let application = "Intelligent field development planning"

  let vmName = "vm-" + randomSuffix()
  let vmActualName = vmName + ".ptt.corp"
  let otherTask = "Turn off firewall for 10.0.1.2 port 8888"

  let approverName = "Lertwut Khan"
  let assigneeName = "Kajornthep Pi"

  let dataCenter = "1"
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
        .addCreateVm({
          name: vmName,
          cpu: "2",
          memory: "4",
          os: "RHEL7.6",
          environment: "Dev"
        })
        .addCreateOther({
          message: otherTask
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
      [vmName]: {
        hostname: vmActualName,
        ipAddress: "127.0.0.1"
      },
    })

    await requestor.findResources(project, application, [vmActualName])
  })

  it("Update existing resources", async () => {
    requestor = await Requestor.init()
    ticketNo = await requestor.createTicket(
      new TicketBuilder()
        .withProject(project)
        .withApplication(application)
        .withDataCenter(dataCenter)
        .withJobCode(jobCode)
        .addUpdateVm(vmActualName,{
          cpu: "4",
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
      [vmName]: {
        hostname: vmActualName,
        ipAddress: "127.0.0.1"
      },
    })

    await requestor.findResources(project, application, [vmActualName])
  })

  it("Dismiss existing resources", async () => {
    requestor = await Requestor.init()
    ticketNo = await requestor.createTicket(
      new TicketBuilder()
        .withProject(project)
        .withApplication(application)
        .withDataCenter(dataCenter)
        .withJobCode(jobCode)
        .addDismissVm(vmActualName)
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

    await requestor.cannotFindResources(project, application, [vmActualName])
  })

  afterEach(async () => {
    if (requestor) {
      // await requestor.done()
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
