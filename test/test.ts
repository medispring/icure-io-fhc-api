import { fhcStscontrollerApi } from "../api/fhcStscontrollerApi"
import { expect } from "chai"

describe("STS", () => {
  it("should upload the keystore", async () => {
    const res = new fhcStscontrollerApi("https://fhcacc.icure.cloud", []).uploadKeystoreUsingPOST(
      new Uint8Array().buffer
    )
    expect(await res).to.match(
      /[A-Za-z0-9]{8}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{12}/
    )
  })
})
