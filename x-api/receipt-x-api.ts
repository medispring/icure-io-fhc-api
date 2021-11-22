import { IccReceiptXApi, string2ua, ua2ab, User } from "@icure/api"

import * as _ from "lodash"
import * as moment from "moment"

import {
  AgreementResponse,
  DmgAcknowledge,
  DmgConsultation,
  DmgNotification,
  DmgRegistration,
  InsurabilityInfoDto,
  TarificationConsultationResult
} from "../model/models"

export class ReceiptXApi {
  private api: IccReceiptXApi

  constructor(api: IccReceiptXApi) {
    this.api = api
  }

  /**
   * log Soap conversation receipt
   */
  logSCReceipt(
    object:
      | AgreementResponse
      | DmgConsultation
      | DmgAcknowledge
      | DmgConsultation
      | DmgNotification
      | DmgRegistration
      | TarificationConsultationResult
      | InsurabilityInfoDto,
    user: User,
    docId: string,
    cat: string,
    subcat: string,
    refs: Array<string> = []
  ) {
    return this.api
      .newInstance(user, {
        category: cat,
        subCategory: subcat,
        documentId: docId,
        references: refs.concat(
          object.commonOutput
            ? _.compact([
                object.commonOutput.inputReference &&
                  `mycarenet:${cat}:inputReference:${object.commonOutput.inputReference}`,
                object.commonOutput.inputReference &&
                  `mycarenet:${cat}:outputReference:${object.commonOutput.outputReference}`,
                object.commonOutput.inputReference &&
                  `mycarenet:${cat}:nipReference:${object.commonOutput.nipReference}`
              ])
            : [],
          ["date:" + moment().format("YYYYMMDDHHmmss")]
        )
      })
      .then(rcpt => this.api.createReceipt(rcpt))
      .then(rcpt =>
        this.api.setReceiptAttachment(
          rcpt.id,
          "soapConversation",
          undefined,
          ua2ab(string2ua(JSON.stringify(object.mycarenetConversation)))
        )
      )
  }
}
