import Requestor from "./actor/requestor"
import {randomSuffix} from "./util"


describe("Prepare project structure for resource management", () => {
  let requestor: Requestor
  // let projectName = "PTTEP-e-Payment " + randomSuffix()
  let projectName = "PTTEP-e-Payment"

  beforeAll(async () => {
    requestor = await Requestor.init()
  })

  it("create project.", async () => {
    const projectInfo = {
      name: projectName,
      jobCode: "9034634234678743"
    }

    const actual = await requestor.createProject(projectInfo)
    expect(actual).toEqual(projectInfo)
  })

  it("create application under the specified project.", async () => {
    const appInfo = {
      project: projectName,
      name: "Intelligent field development planning",
      description: "ลง Application และ Develop Software สำหรับโปรเจค iFDP",
      supporterName: "คิวดล มาตรยากูร",
      supporterEmail: "siwadol@ptt.corp",
      supporterDepartment: "Outsourcing",
      supporterOrganization: "PTTEP"
    }

    const actual = await requestor.createApplication(appInfo)
    expect(actual).toEqual(appInfo)
  })

  afterAll(async () => {
    await requestor.done()
  })
})