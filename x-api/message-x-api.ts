import {
  AbstractFilterPatient,
  EntityReference,
  FilterChainPatient,
  HealthcareParty,
  IccCryptoXApi,
  IccDocumentXApi,
  IccEntityrefApi,
  IccInsuranceApi,
  IccInvoiceXApi,
  IccMessageXApi,
  IccPatientApi,
  IccPatientXApi,
  Insurance,
  Invoice,
  ListOfIds,
  Message,
  PaginatedListPatient,
  Patient,
  PatientHealthCareParty,
  Receipt,
  ReferralPeriod,
  string2ua,
  ua2ab,
  User,
  XHR
} from "@icure/api"

import * as _ from "lodash"
import * as moment from "moment"

import {
  decodeBase36Uuid,
  getFederaton,
  InvoiceWithPatient,
  toInvoiceBatch,
  uuidBase36,
  uuidBase36Half
} from "./utils/efact-util"
import { timeEncode } from "./utils/formatting-util"
import {
  DmgClosure,
  DmgExtension,
  DmgsList,
  EfactMessage,
  EfactSendResponse,
  ErrorDetail,
  GenAsyncResponse,
  HcpartyType,
  IDHCPARTY
} from "../model/models"
import {
  EfactMessage920098Reader,
  EfactMessage920099Reader,
  EfactMessage920900Reader,
  EfactMessage920999Reader,
  EfactMessage931000Reader,
  EfactMessageReader,
  ET20_80Data,
  ET50Data,
  ET91Data,
  ET92Data,
  File920900Data
} from "./utils/efact-parser"
import { fhcEfactApi } from "../api/fhcEfactApi"
import { ReceiptXApi } from "./receipt-x-api"

interface StructError {
  itemId: string | null
  error: ErrorDetail
  record: string
}

class EfactSendResponseWithError extends EfactSendResponse {
  public error: string | undefined
  constructor(json: JSON) {
    super(json)
  }
}

export class MessageXApi {
  private api: IccMessageXApi
  private crypto: IccCryptoXApi
  private insuranceApi: IccInsuranceApi
  private entityReferenceApi: IccEntityrefApi
  private receiptXApi: ReceiptXApi
  private invoiceXApi: IccInvoiceXApi
  private documentXApi: IccDocumentXApi
  private patientXApi: IccPatientXApi
  private patientApi: IccPatientApi

  constructor(
    api: IccMessageXApi,
    crypto: IccCryptoXApi,
    documentXApi: IccDocumentXApi,
    insuranceApi: IccInsuranceApi,
    entityReferenceApi: IccEntityrefApi,
    fhcReceiptXApi: ReceiptXApi,
    invoiceXApi: IccInvoiceXApi,
    patientXApi: IccPatientXApi,
    patientApi: IccPatientApi
  ) {
    this.api = api
    this.documentXApi = documentXApi
    this.insuranceApi = insuranceApi
    this.entityReferenceApi = entityReferenceApi
    this.receiptXApi = fhcReceiptXApi
    this.invoiceXApi = invoiceXApi
    this.patientXApi = patientXApi
    this.patientApi = patientApi
    this.crypto = crypto
  }

  saveDmgsListRequest(user: User, req: GenAsyncResponse, requestDate?: number): Promise<Message> {
    return this.api
      .newInstance(user, {
        // tslint:disable-next-line:no-bitwise
        transportGuid:
          "GMD:OUT:" +
          (
            (req.commonOutput && req.commonOutput.inputReference) ||
            req.tack!.appliesTo ||
            ""
          ).replace("urn:nip:reference:input:", ""),
        fromHealthcarePartyId: user.healthcarePartyId,
        sent: +new Date(),
        metas: {
          type: "listrequest",
          date: moment().format("DD/MM/YYYY"),
          requestDate: requestDate ? moment(requestDate).format("DD/MM/YYYY") : ""
        },
        subject: "Lists request",
        senderReferences: req.commonOutput
      })
      .then(msg => this.api.createMessage(msg))
      .then(msg => {
        return this.documentXApi
          .newInstance(user, msg, {
            mainUti: "public.json",
            name: `${msg.subject}_content.json`
          })
          .then(doc => this.documentXApi.createDocument(doc))
          .then(doc =>
            this.documentXApi.setDocumentAttachment(
              doc.id!!,
              undefined /*TODO provide keys for encryption*/,
              <any>ua2ab(string2ua(JSON.stringify(req)))
            )
          )
          .then(() => msg)
      })
  }

  processDmgMessagesList(
    user: User,
    hcp: HealthcareParty,
    list: DmgsList,
    docXApi: IccDocumentXApi
  ): Promise<Array<Array<string>>> {
    const ackHashes: Array<string> = []
    let promAck: Promise<Receipt | null> = Promise.resolve(null)
    _.each(list.acks, ack => {
      const ref = (ack.appliesTo || "").replace("urn:nip:reference:input:", "")
      promAck = promAck
        .then(() =>
          this.api.findMessagesByTransportGuid(`GMD:OUT:${ref}`, false, undefined, undefined, 100)
        )
        .then(parents => {
          const msgsForHcp = ((parents && parents.rows) || []).filter(
            (p: Message) => p.responsible === hcp.id
          )
          if (!msgsForHcp.length) {
            throw new Error(`Cannot find parent with ref ${ref}`)
          }
          const parent: Message = msgsForHcp[0]
          ;(parent.metas || (parent.metas = {}))[`tack.${ack.io}`] = (
            (ack.date && moment(ack.date)) ||
            moment()
          ).format("YYYYMMDDHHmmss")
          return this.api.modifyMessage(parent)
        })
        .catch(e => {
          console.log(e.message)
          return null
        })
        .then(() =>
          this.receiptXApi.logSCReceipt(ack, user, hcp.id!!, "dmg", "listAck", [
            `nip:pin:valuehash:${ack.valueHash}`
          ])
        )
        .then(receipt => {
          ack.valueHash && ackHashes.push(ack.valueHash)
          return receipt
        })
    })

    const patsDmgs: { [key: string]: any } = {}
    const msgHashes: Array<string> = []

    let promMsg: Promise<Array<Message>> = promAck.then(() => [])
    _.each(list.lists, dmgsMsgList => {
      const metas = { type: "list" }
      _.each(dmgsMsgList.inscriptions, i => {
        i.inss &&
          (patsDmgs[i.inss] || (patsDmgs[i.inss] = [])).push({
            date: moment(i.from).format("DD/MM/YYYY"),
            from: moment(i.from).format("DD/MM/YYYY"),
            to: i.to,
            hcp: this.makeHcp(i.hcParty),
            payments: (i.payment1Amount
              ? [
                  {
                    amount: i.payment1Amount,
                    currency: i.payment1Currency,
                    date: i.payment1Date,
                    ref: i.payment1Ref
                  }
                ]
              : []
            ).concat(
              i.payment2Amount
                ? [
                    {
                      amount: i.payment2Amount,
                      currency: i.payment2Currency,
                      date: i.payment2Date,
                      ref: i.payment2Ref
                    }
                  ]
                : []
            )
          })
      })
      promMsg = promMsg.then(acc => {
        let ref = (dmgsMsgList.appliesTo || "").replace("urn:nip:reference:input:", "")
        return this.api
          .findMessagesByTransportGuid(`GMD:OUT:${ref}`, false, undefined, undefined, 100)
          .then(parents => {
            const msgsForHcp = ((parents && parents.rows) || []).filter(
              (p: Message) => p.responsible === hcp.id
            )
            if (!msgsForHcp.length) {
              throw new Error(`Cannot find parent with ref ${ref}`)
            }
            const parent: Message = msgsForHcp[0]

            return this.saveMessageInDb(
              user,
              "List",
              dmgsMsgList,
              hcp,
              metas,
              docXApi,
              dmgsMsgList.date,
              undefined,
              parent && parent.id
            ).then(msg => {
              dmgsMsgList.valueHash && msgHashes.push(dmgsMsgList.valueHash)
              acc.push(msg)
              return acc
            })
          })
          .catch(e => {
            console.log(e.message)
            return acc
          })
      })
    })

    _.each(list.closures, closure => {
      const metas = {
        type: "closure",
        date:
          (closure.endOfPreviousDmg && moment(closure.endOfPreviousDmg).format("DD/MM/YYYY")) ||
          null,
        closure: "true",
        endOfPreviousDmg:
          (closure.endOfPreviousDmg && moment(closure.endOfPreviousDmg).format("DD/MM/YYYY")) ||
          null,
        beginOfNewDmg:
          (closure.beginOfNewDmg && moment(closure.beginOfNewDmg).format("DD/MM/YYYY")) || null,
        previousHcp: this.makeHcp(closure.previousHcParty),
        newHcp: this.makeHcp(closure.newHcParty),
        ssin: closure.inss || null,
        firstName: closure.firstName || null,
        lastName: closure.lastName || null,
        io: closure.io || null
      }
      closure.inss && (patsDmgs[closure.inss] || (patsDmgs[closure.inss] = [])).push(metas)
      promMsg = promMsg.then(acc => {
        return this.saveMessageInDb(
          user,
          "Closure",
          closure,
          hcp,
          metas,
          docXApi,
          closure.endOfPreviousDmg,
          closure.inss
        ).then(msg => {
          closure.valueHash && msgHashes.push(closure.valueHash)
          acc.push(msg)
          return acc
        })
      })
    })

    _.each(list.extensions, ext => {
      const metas = {
        type: "extension",
        date: (ext.encounterDate && moment(ext.encounterDate).format("DD/MM/YYYY")) || null,
        from: (ext.encounterDate && moment(ext.encounterDate).format("DD/MM/YYYY")) || null,
        hcp: this.makeHcp(ext.hcParty),
        claim: ext.claim || null,
        ssin: ext.inss || null,
        firstName: ext.firstName || null,
        lastName: ext.lastName || null,
        io: ext.io || null
      }
      ext.inss && (patsDmgs[ext.inss] || (patsDmgs[ext.inss] = [])).push(metas)
      promMsg = promMsg.then(acc => {
        return this.saveMessageInDb(
          user,
          "Extension",
          ext,
          hcp,
          metas,
          docXApi,
          ext.encounterDate,
          ext.inss
        ).then(msg => {
          ext.valueHash && msgHashes.push(ext.valueHash)
          acc.push(msg)
          return acc
        })
      })
    })

    let promPatient: Promise<Patient[]> = Promise.resolve([])

    return promMsg.then(() => {
      _.chunk(Object.keys(patsDmgs), 100).forEach(ssins => {
        promPatient = promPatient
          .then(() =>
            this.patientApi
              .filterPatientsBy(
                undefined,
                undefined,
                1000,
                0,
                undefined,
                false,
                new FilterChainPatient({
                  filter: new AbstractFilterPatient({
                    $type: "PatientByHcPartyAndSsinsFilter",
                    healthcarePartyId: user.healthcarePartyId,
                    ssins: ssins
                  })
                })
              )
              .then((pats: PaginatedListPatient) =>
                Promise.all(
                  (pats.rows || []).map(p => {
                    const actions = _.sortBy(patsDmgs[p.ssin!!], a =>
                      moment(a.date, "DD/MM/YYYY").format("YYYYMMDD")
                    )

                    let phcp: PatientHealthCareParty | undefined =
                      (p.patientHealthCareParties || (p.patientHealthCareParties = [])) &&
                      p.patientHealthCareParties.find(
                        phcp => phcp.healthcarePartyId === user.healthcarePartyId
                      )
                    if (!phcp) {
                      phcp = new PatientHealthCareParty({ healthcarePartyId: user.healthcarePartyId, referralPeriods: [] })
                      p.patientHealthCareParties.push(phcp)
                    }
                    if (!phcp.referralPeriods) {
                      phcp.referralPeriods = []
                    }
                    const referralPeriods: ReferralPeriod[] = phcp.referralPeriods

                    actions.map(action =>{
                      const actionDate = Number(
                        moment(action?.date || "", "DD/MM/YYYY").format("YYYYMMDD")
                      )
                      if(action){
                        if(action.closure) {
                          const rp: ReferralPeriod|undefined = referralPeriods.find(per => ((!per.endDate || per.endDate >= actionDate) && (per?.startDate || 0) <= actionDate)
                            || (action.form && (!per.endDate || per.endDate >= Number(moment(action.form).format("YYYYMMDD"))) && (per?.startDate || 0) <= Number(moment(action.form).format("YYYYMMDD")))
                            || (action.to && (!per.endDate || per.endDate >= Number(moment(action.to).format("YYYYMMDD"))) && (per?.startDate || 0) <= Number(moment(action.to).format("YYYYMMDD")))
                          )
                          if(rp) {
                            if(action.from){
                              const from = Number(moment(action.from).format("YYYYMMDD"))
                              rp.startDate = from < (rp.startDate || 99999999) ? from : rp.startDate
                            }
                            if(action.to){
                              const to = Number(moment(action.to).format("YYYYMMDD"))
                              rp.endDate = to > (rp.endDate || 0) ? to : rp.endDate
                            }
                            rp.endDate = actionDate > (rp.endDate || 0) ? actionDate : rp.endDate
                            rp.comment = (rp.comment+' ' || '') + (rp.endDate ? "Correction End Date. " : "") + `Transferred to ${action.newHcp}`
                          }else{
                            const endDate= (actionDate || action.to) ? (Number(moment(action.to).format("YYYYMMDD")) > actionDate ? Number(moment(action.to).format("YYYYMMDD")) : actionDate) : moment().format("YYYYMMDD")
                            const startDate= action.from ? Number(moment(action.from).format("YYYYMMDD")) : moment().format("YYYYMMDD")
                            referralPeriods.push(new ReferralPeriod({ startDate: startDate, endDate: endDate, comment: `Transferred to ${action.newHcp}` }))
                          }
                        } else{
                          const rp: ReferralPeriod|undefined = referralPeriods.find(per => (!per.endDate || per.endDate > actionDate) && (per?.startDate || 0) < actionDate)
                          if(rp) {
                            if(action.from){
                              const from = Number(moment(action.from).format("YYYYMMDD"))
                              rp.startDate = from < (rp.startDate || 99999999) ? from : rp.startDate
                            }
                            rp.startDate = actionDate < (rp.startDate || 99999999) ? actionDate : rp.startDate
                            if(action.to){
                              const to = Number(moment(action.to).format("YYYYMMDD"))
                              rp.endDate = to > (rp.endDate || 0) ? to : rp.endDate
                            }
                            rp.comment = (rp.comment+' ' || '')+ 'Correction Start Date.'
                          }else {
                            const endDate= action.to ? Number(moment(action.to).format("YYYYMMDD")): null
                            const startDate= (actionDate || action.from) ? (Number(moment(action.from).format("YYYYMMDD")) < actionDate ? Number(moment(action.from).format("YYYYMMDD")) : actionDate) : moment().format("YYYYMMDD")
                            referralPeriods.push(new ReferralPeriod({ startDate: startDate, endDate: endDate, comment: `New Referral to ${action.newHcp}`}))
                          }
                        }
                      }
                    })
                    phcp.referralPeriods = referralPeriods.sort((a, b) => (a.startDate || 0) - (b.startDate || 0))
                    phcp.referral = !Boolean(referralPeriods[referralPeriods.length - 1].endDate)
                    return p
                  })
                )
              )
          )
          .then(pats =>
            this.patientApi.bulkUpdatePatients(pats || []).catch(() => {
              let catchProm: Promise<Patient[]> = Promise.resolve([])
              let newPats: Patient[] = []
              ;(pats || []).forEach((pat: Patient) => {
                catchProm = catchProm.then(() =>
                  this.patientApi.modifyPatient(pat).then(p => (newPats = newPats.concat(p)))
                )
              })
              return catchProm
            })
          )
      })
      return promPatient.then(() => [ackHashes, msgHashes])
    })
  }

  private makeHcp(hcParty: HcpartyType | null | undefined) {
    if (!hcParty) {
      return null
    }
    return `${hcParty.firstname || ""} ${hcParty.familyname || ""} ${hcParty.name ||
      ""} [${(hcParty.ids &&
      (hcParty.ids.find(id => id.s === IDHCPARTY.SEnum.IDHCPARTY) || {}).value) ||
      "-"}]`
  }

  private saveMessageInDb(
    user: User,
    msgName: string,
    dmgMessage: DmgsList | DmgClosure | DmgExtension,
    hcp: HealthcareParty,
    metas: { [key: string]: string | null },
    docXApi: IccDocumentXApi,
    date?: Date,
    inss?: string,
    parentId?: string
  ) {
    return this.api
      .newInstance(user, {
        // tslint:disable-next-line:no-bitwise
        transportGuid: "GMD:IN:" + dmgMessage.reference,
        fromAddress: dmgMessage.io,
        sent: date && +date,
        toHealthcarePartyId: hcp.id,
        recipients: [hcp.id],
        recipientsType: "org.taktik.icure.entities.HealthcareParty",
        received: +new Date(),
        metas: metas,
        parentId: parentId,
        subject: inss
          ? `${msgName} from IO ${dmgMessage.io} for ${inss}`
          : `${msgName} from IO ${dmgMessage.io}`,
        senderReferences: {
          inputReference: dmgMessage.commonOutput && dmgMessage.commonOutput.inputReference,
          outputReference: dmgMessage.commonOutput && dmgMessage.commonOutput.outputReference,
          nipReference: dmgMessage.commonOutput && dmgMessage.commonOutput.nipReference
        }
      })
      .then(msg => this.api.createMessage(msg))
      .then(msg => {
        return docXApi
          .newInstance(user, msg, {
            mainUti: "public.json",
            name: `${msg.subject}_content.json`
          })
          .then(doc => docXApi.createDocument(doc))
          .then(doc =>
            docXApi.setDocumentAttachment(
              doc.id!!,
              undefined /*TODO provide keys for encryption*/,
              <any>ua2ab(string2ua(JSON.stringify(dmgMessage)))
            )
          )
          .then(() => msg)
      })
  }

  saveDmgListRequestInDb(
    user: User,
    tack: string,
    resultMajor: string,
    appliesTo: string,
    hcp: HealthcareParty,
    date?: Date,
    inss?: string
  ) {
    return this.api
      .newInstance(user, {
        // tslint:disable-next-line:no-bitwise
        transportGuid: "GMD:OUT:LIST" + appliesTo,
        sent: date && +date,
        toHealthcarePartyId: hcp.id,
        recipients: [hcp.id],
        recipientsType: "org.taktik.icure.entities.HealthcareParty",
        received: +new Date(),
        metas: { tack: tack, resultMajor: resultMajor },
        subject: inss ? `Dmg list request for ${inss}` : `Dmg list request`,
        senderReferences: {
          inputReference: appliesTo && _.last(appliesTo.split(":"))
        }
      })
      .then(msg => this.api.createMessage(msg))
  }

  extractErrorMessage(error?: ErrorDetail): string | undefined {
    if (!error) return

    const code1 = Number(error.rejectionCode1)
    const code2 = Number(error.rejectionCode2)
    const code3 = Number(error.rejectionCode3)
    const desc1 = (error.rejectionDescr1 && error.rejectionDescr1.trim()) || ""
    const desc2 = (error.rejectionDescr2 && error.rejectionDescr2.trim()) || ""
    const desc3 = (error.rejectionDescr3 && error.rejectionDescr3.trim()) || ""

    return code1 || code2 || code3 || desc1 || desc2 || desc3
      ? _([
          code1 || desc1.length ? `${code1 || "XXXXXX"}: ${desc1 || " — "}` : null,
          code2 || desc2.length ? `${code2 || "XXXXXX"}: ${desc2 || " — "}` : null,
          code3 || desc3.length ? `${code3 || "XXXXXX"}: ${desc3 || " — "}` : null
        ])
          .compact()
          .uniq()
          .filter(err => err.indexOf("510119") < 0)
          .join("; ")
      : undefined
  }

  extractErrors(parsedRecords: any, oa: string): string[] {
    const errors: ErrorDetail[] = (parsedRecords.et10 &&
    parsedRecords.et10.errorDetail &&
    this.isBlockingError(parsedRecords.et10.errorDetail, oa)
      ? [parsedRecords.et10.errorDetail]
      : []
    )
      .concat(
        _.flatMap(parsedRecords.records as ET20_80Data[], r => {
          const errors: Array<ErrorDetail> = []

          if (r.et20 && r.et20.errorDetail && this.isBlockingError(r.et20.errorDetail, oa)) {
            errors.push(r.et20.errorDetail)
          }
          _.each(r.items, i => {
            if (i.et50 && i.et50.errorDetail && this.isBlockingError(i.et50.errorDetail, oa))
              errors.push(i.et50.errorDetail)
            if (i.et51 && i.et51.errorDetail && this.isBlockingError(i.et51.errorDetail, oa))
              errors.push(i.et51.errorDetail)
            if (i.et52 && i.et52.errorDetail && this.isBlockingError(i.et52.errorDetail, oa))
              errors.push(i.et52.errorDetail)
          })
          if (r.et80 && r.et80.errorDetail && this.isBlockingError(r.et80.errorDetail, oa)) {
            errors.push(r.et80.errorDetail)
          }
          return errors
        })
      )
      .concat(
        parsedRecords.et90 &&
          parsedRecords.et90.errorDetail &&
          this.isBlockingError(parsedRecords.et90.errorDetail, oa)
          ? [parsedRecords.et90.errorDetail]
          : []
      )

    return _.compact(_.map(errors, error => this.extractErrorMessage(error)))
  }

  isBlockingError(errorDetail: ErrorDetail, oa: string): boolean {
    //check : https://medispring.atlassian.net/browse/MS-7967
    //check : https://medispring.atlassian.net/browse/MS-8650
    const lineNumbersToVerify = ["1", "2", "3"]
    const nonBlockingErrorLetters = ["E"]
    const nonBlockingErrorCodesByOa: { [key: string]: string[] } = {
      "100": ["502744"],
      "200": [],
      "300": [],
      "306": [],
      "400": [],
      "500": [],
      "600": ["500524"],
      "700": [],
      "800": [],
      "900": []
    }

    return lineNumbersToVerify.some(lineNumber => {
      const rejectionLetter = `${(errorDetail as { [key: string]: string } | undefined)?.[
        "rejectionLetter" + lineNumber
      ] || ""}`.trim()
      const rejectionCode = `${(errorDetail as { [key: string]: string } | undefined)?.[
        "rejectionCode" + lineNumber
      ] || ""}`.trim()
      if (!rejectionLetter) return false

      return (
        !nonBlockingErrorLetters.includes(rejectionLetter) &&
        !(nonBlockingErrorCodesByOa[oa] || []).includes(rejectionCode)
      )
    })
  }

  processTack(user: User, hcp: HealthcareParty, efactMessage: EfactMessage): Promise<Receipt> {
    if (!efactMessage.tack) {
      return Promise.reject(new Error("Invalid tack"))
    }

    const refStr = _.get(efactMessage, "tack.appliesTo", "")
      .split(":")
      .pop()
    if (!refStr) {
      return Promise.reject(
        new Error(`Cannot find input reference from tack: ${_.get(efactMessage, "tack.appliesTo")}`)
      )
    }
    const ref = Number(refStr!!) % 10000000000

    return this.api
      .findMessagesByTransportGuid("EFACT:BATCH:" + ref, false, undefined, undefined, 100)
      .then(parents => {
        const msgsForHcp = ((parents && parents.rows) || []).filter(
          (p: Message) => p.responsible === hcp.id
        )
        if (!msgsForHcp.length) {
          throw new Error(`Cannot find parent with ref ${ref}`)
        }
        const parentMessage: Message = msgsForHcp[0]

        return this.receiptXApi.iccApi
          .createReceipt(
            new Receipt({
              id: this.crypto.randomUuid(),
              documentId: parentMessage.id,
              references: [
                `mycarenet:efact:inputReference:${ref}`,
                efactMessage.tack!!.appliesTo,
                efactMessage.tack!!.reference
              ]
            })
          )
          .then((rcpt: Receipt) =>
            this.receiptXApi.iccApi.setReceiptAttachment(
              rcpt.id!,
              "tack",
              "",
              <any>ua2ab(string2ua(JSON.stringify(efactMessage)))
            )
          )
          .then(() => {
            parentMessage.status = parentMessage.status!! | (1 << 8) /*STATUS_SUBMITTED*/

            // Reset error
            if (parentMessage.metas && parentMessage.metas.errors) {
              parentMessage.metas.sendingError = parentMessage.metas.errors
              delete parentMessage.metas.errors
            }
            return this.api.modifyMessage(parentMessage)
          })
      })
  }

  // Pass invoicePrefix if you want to generate the invoice reference from entityRef
  processEfactMessage(
    user: User,
    hcp: HealthcareParty,
    efactMessage: EfactMessage,
    invoicePrefix?: string,
    invoicePrefixer?: (invoice: Invoice, hcpId: string) => Promise<string>
  ): Promise<{ message: Message; invoices: Array<Invoice> }> {
    const oa: string = (efactMessage.message?.[0]?.zones || [])
      ?.find((z: any) => z.zoneDescription?.zones?.contains("204"))
      ?.value.toString()
      .substring(8, 11)
    const ref = efactMessage.commonOutput!!.inputReference
      ? Number(efactMessage.commonOutput!!.inputReference) % 10000000000
      : Number(efactMessage.commonOutput!!.outputReference!!.replace(/\D+/g, "")) % 10000000000
    return this.api
      .findMessagesByTransportGuid("EFACT:BATCH:" + ref, false, undefined, undefined, 100)
      .then(parents => {
        const msgsForHcp: Message[] = _.filter(
          parents && parents.rows,
          (p: Message) => p.responsible === hcp.id
        )
        if (!msgsForHcp.length) {
          throw new Error(`Cannot find parent with ref ${ref}`)
        }

        const messageType = efactMessage.detail!!.substr(0, 6)
        const parser: EfactMessageReader | null =
          messageType === "920098"
            ? new EfactMessage920098Reader(efactMessage)
            : messageType === "920099"
            ? new EfactMessage920099Reader(efactMessage)
            : messageType === "920900"
            ? new EfactMessage920900Reader(efactMessage)
            : messageType === "920999"
            ? new EfactMessage920999Reader(efactMessage)
            : messageType === "931000"
            ? new EfactMessage931000Reader(efactMessage)
            : null

        if (!parser) {
          throw Error(`Unsupported message type ${messageType}`)
        }

        const parsedRecords = parser.read()
        if (!parsedRecords) {
          throw new Error("Cannot parse...")
        }

        // Find message for Hcp based on the invoiceReference if present (!931000)
        const fileReference = _.get(parsedRecords, "et10.invoiceReference")
        const parentMessage = fileReference
          ? _.find(msgsForHcp, m => uuidBase36(m.id!!) === fileReference.trim())
          : msgsForHcp[0]

        if (!parentMessage) {
          throw new Error(`Cannot match parent with fileReference for file with ref ${ref}`)
        }

        const errors = this.extractErrors(parsedRecords, oa)
        const statuses =
          (["920999", "920099"].includes(messageType) ? 1 << 17 /*STATUS_FULL_ERROR*/ : 0) |
          (["920900"].includes(messageType) && errors.length
            ? 1 << 16 /*STATUS_PARTIAL_SUCCESS*/
            : 0) |
          (["920900"].includes(messageType) && !errors.length
            ? 1 << 15 /*STATUS_FULL_SUCCESS*/
            : 0) |
          (["920999"].includes(messageType) ? 1 << 12 /*STATUS_REJECTED*/ : 0) |
          (["920900", "920098", "920099"].includes(messageType) ? 1 << 11 /*STATUS_ACCEPTED*/ : 0) |
          (["920098"].includes(messageType) && errors.length
            ? 1 << 22 /*STATUS_ERRORS_IN_PRELIMINARY_CONTROL*/
            : 0) |
          (["931000"].includes(messageType) ? 1 << 10 /*STATUS_ACCEPTED_FOR_TREATMENT*/ : 0) |
          (["931000", "920999"].includes(messageType) ? 1 << 9 /*STATUS_RECEIVED*/ : 0)

        const batchErrors: ErrorDetail[] | undefined = _.compact([
          _.get(parsedRecords, "zone200.errorDetail"),
          _.get(parsedRecords, "zone300.errorDetail"),
          _.get(parsedRecords, "et10.errorDetail"),
          _.get(parsedRecords, "et90.errorDetail")
        ])

        const invoicingErrors: StructError[] = parsedRecords.records
          ? _.compact(
              _.flatMap(parsedRecords.records as ET20_80Data[], r => {
                const errors: StructError[] = []
                let refEt20 = r.et20 && r.et20.reference.trim()
                if (r.et20 && r.et20.errorDetail) {
                  errors.push({
                    itemId: decodeBase36Uuid(refEt20),
                    error: r.et20.errorDetail,
                    record: "ET20"
                  })
                  if (r.et80 && r.et80.errorDetail) {
                    errors.push({
                      itemId: decodeBase36Uuid(refEt20),
                      error: r.et80.errorDetail,
                      record: "ET80"
                    })
                  }
                }

                _.each(r.items, i => {
                  let ref = (i.et50 && i.et50.itemReference.trim()) || refEt20 //fallback
                  if (i.et50 && i.et50.errorDetail) {
                    errors.push({
                      itemId: ref && decodeBase36Uuid(ref),
                      error: i.et50.errorDetail,
                      record: "ET50"
                    })
                  }
                  if (i.et51 && i.et51.errorDetail) {
                    errors.push({
                      itemId: ref && decodeBase36Uuid(ref),
                      error: i.et51.errorDetail,
                      record: "ET51"
                    })
                  }
                  if (i.et52 && i.et52.errorDetail) {
                    errors.push({
                      itemId: ref && decodeBase36Uuid(ref),
                      error: i.et52.errorDetail,
                      record: "ET52"
                    })
                  }
                })
                return errors
              })
            )
          : []

        return this.api
          .newInstance(user, {
            // tslint:disable-next-line:no-bitwise
            status: (1 << 1) /*STATUS_UNREAD*/ | statuses,
            transportGuid: "EFACT:IN:" + ref,
            fromAddress: "EFACT",
            sent: timeEncode(new Date()),
            fromHealthcarePartyId: hcp.id,
            recipients: [hcp.id],
            recipientsType: "org.taktik.icure.entities.HealthcareParty",
            received: +new Date(),
            subject: messageType,
            parentId: parentMessage.id,
            senderReferences: {
              inputReference: efactMessage.commonOutput!!.inputReference,
              outputReference: efactMessage.commonOutput!!.outputReference,
              nipReference: efactMessage.commonOutput!!.nipReference
            }
          })
          .then(msg => this.api.createMessage(msg))
          .then(msg =>
            Promise.all([
              this.documentXApi.newInstance(user, msg, {
                mainUti: "public.plain-text",
                name: msg.subject
              }),
              this.documentXApi.newInstance(user, msg, {
                mainUti: "public.json",
                name: `${msg.subject}_records`
              }),
              this.documentXApi.newInstance(user, msg, {
                mainUti: "public.json",
                name: `${msg.subject}_parsed_records`
              })
            ])
              .then(([doc, jsonDoc, jsonParsedDoc]) =>
                Promise.all([
                  this.documentXApi.createDocument(doc),
                  this.documentXApi.createDocument(jsonDoc),
                  this.documentXApi.createDocument(jsonParsedDoc)
                ])
              )
              .then(([doc, jsonDoc, jsonParsedDoc]) =>
                Promise.all([
                  this.documentXApi.setDocumentAttachment(
                    doc.id!!,
                    undefined /*TODO provide keys for encryption*/,
                    <any>ua2ab(string2ua(efactMessage.detail!!))
                  ),
                  this.documentXApi.setDocumentAttachment(
                    jsonDoc.id!!,
                    undefined /*TODO provide keys for encryption*/,
                    <any>ua2ab(string2ua(JSON.stringify(efactMessage)))
                  ),
                  this.documentXApi.setDocumentAttachment(
                    jsonParsedDoc.id!!,
                    undefined /*TODO provide keys for encryption*/,
                    <any>ua2ab(string2ua(JSON.stringify(parsedRecords)))
                  )
                ])
              )
              .then(() =>
                ["920999", "920099", "920900"].includes(messageType)
                  ? this.invoiceXApi.getInvoices(new ListOfIds({ ids: parentMessage.invoiceIds }))
                  : Promise.resolve([])
              )
              .then((invoices: Array<Invoice>) => {
                // RejectAll if "920999", "920099"
                const rejectAll = (statuses & (1 << 17)) /*STATUS_ERROR*/ > 0

                let promise: Promise<Array<Invoice>> = Promise.resolve([])

                _.forEach(invoices, iv => {
                  iv.error =
                    _(invoicingErrors)
                      .filter(it => it.itemId === iv.id)
                      .map(e => this.extractErrorMessage(e.error))
                      .compact()
                      .join("; ") || undefined

                  let newInvoicePromise: Promise<Invoice> | null = null
                  _.each(iv.invoicingCodes, ic => {
                    // If the invoicing code is already treated, do not treat it
                    if (ic.canceled || ic.accepted) {
                      return
                    }

                    // Error from the ET50/51/52 linked to the invoicingCode
                    const codeError =
                      _(invoicingErrors)
                        .filter(it => it.itemId === ic.id)
                        .map(e => this.extractErrorMessage(e.error))
                        .compact()
                        .join("; ") || undefined

                    // check if it has a blocking error
                    const hasBlockingError: boolean = invoicingErrors.some(
                      it => it.itemId === ic.id && this.isBlockingError(it.error, oa)
                    )

                    const record50: ET50Data | undefined =
                      messageType === "920900"
                        ? _.compact(
                            _.flatMap(
                              (parsedRecords as File920900Data).records,
                              r =>
                                r.items!!.map(
                                  i =>
                                    _.get(i, "et50.itemReference") &&
                                    decodeBase36Uuid(i.et50!!.itemReference.trim()) === ic.id &&
                                    i.et50
                                ) as ET50Data[]
                            )
                          )[0]
                        : undefined

                    const zone114amount =
                      record50 &&
                      _.get(record50, "errorDetail.zone114") &&
                      Number(record50.errorDetail!!.zone114)

                    if (rejectAll || (!zone114amount && codeError && hasBlockingError)) {
                      ic.accepted = false
                      ic.canceled = true
                      ic.pending = false
                      ic.resent = false
                      ic.error = codeError
                      ic.paid = zone114amount ? Number((zone114amount / 100).toFixed(2)) : 0

                      newInvoicePromise = (
                        newInvoicePromise ||
                        this.patientXApi
                          .getPatientIdOfChildDocumentForHcpAndHcpParents(
                            iv,
                            user.healthcarePartyId!
                          )
                          .then(patientId => this.patientXApi.getPatientWithUser(user, patientId!))
                          .then(pat =>
                            this.invoiceXApi.newInstance(
                              user,
                              pat,
                              _.omit(iv, [
                                "id",
                                "rev",
                                "deletionDate",
                                "created",
                                "modified",
                                "sentDate",
                                "printedDate",
                                "secretForeignKeys",
                                "cryptedForeignKeys",
                                "delegations",
                                "encryptionKeys",
                                "invoicingCodes",
                                "error",
                                "receipts",
                                "encryptedSelf"
                              ])
                            )
                          )
                          .then(niv => {
                            iv.correctiveInvoiceId = niv.id
                            niv.correctedInvoiceId = iv.id
                            return niv
                          })
                      ).then(niv => {
                        niv.invoicingCodes = (niv.invoicingCodes || []).concat(
                          _.assign({}, ic, {
                            id: this.crypto.randomUuid(),
                            accepted: false,
                            canceled: false,
                            pending: true,
                            resent: true,
                            archived: false
                          })
                        )
                        return niv
                      })
                    } else {
                      ic.accepted = true
                      ic.canceled = false
                      ic.pending = false
                      ic.resent = false
                      ic.error = codeError ?? undefined
                      ic.paid = zone114amount
                        ? Number((zone114amount / 100).toFixed(2))
                        : ic.reimbursement
                    }
                  })

                  promise = promise.then(invoices => {
                    return (newInvoicePromise
                      ? newInvoicePromise
                          .then(niv =>
                            (invoicePrefixer
                              ? invoicePrefixer(niv, user.healthcarePartyId!)
                              : Promise.resolve(invoicePrefix)
                            ).then(pfx => this.invoiceXApi.createInvoice(niv, pfx))
                          )
                          .then(niv => invoices.push(niv))
                      : Promise.resolve(0)
                    )
                      .then(() => this.invoiceXApi.modifyInvoice(iv))
                      .then(iv => invoices.push(iv))
                      .then(() => invoices)
                  })
                })

                return promise
              })
              .then(invoices => {
                parentMessage.status = (parentMessage.status || 0) | statuses

                if (batchErrors.length) {
                  parentMessage.metas = _.assign(parentMessage.metas || {}, {
                    errors: _(batchErrors)
                      .map(this.extractErrorMessage)
                      .uniq()
                      .compact()
                      .value()
                      .join("; ")
                  })
                }

                if (parsedRecords.et91) {
                  let et91s = parsedRecords.et91 as Array<ET91Data>
                  parentMessage.metas = _.assign(parentMessage.metas || {}, {
                    paymentReferenceAccount1: _(et91s)
                      .map(et91 => et91.paymentReferenceAccount1)
                      .uniq()
                      .value()
                      .join(", ")
                  })
                }
                if (parsedRecords.et92) {
                  let et92 = parsedRecords.et92 as ET92Data
                  parentMessage.metas = _.assign(parentMessage.metas || {}, {
                    totalAskedAmount: Number(et92.totalAskedAmount) / 100,
                    totalAcceptedAmount: Number(et92.totalAcceptedAmount) / 100,
                    totalRejectedAmount: Number(et92.totalRejectedAmount) / 100
                  })
                }
                return this.api
                  .modifyMessage(parentMessage)
                  .then(
                    message =>
                      ({ message, invoices } as { message: Message; invoices: Array<Invoice> })
                  )
              })
          )
      })
  }

  sendBatch(
    user: User,
    hcp: HealthcareParty,
    invoices: Array<InvoiceWithPatient>,
    xFHCKeystoreId: string,
    xFHCTokenId: string,
    xFHCPassPhrase: string,
    efactApi: fhcEfactApi,
    fhcServer: string | undefined = undefined,
    prefixer?: (fed: Insurance, hcpId: string) => Promise<string>,
    isConnectedAsPmg: boolean = false,
    medicalLocationId: string | null = null,
    speciality: string = "doctor",
    professionCode: string = "10"
  ): Promise<Message> {
    const uuid = this.crypto.randomUuid()
    const smallBase36 = uuidBase36Half(uuid)
    const fullBase36 = uuidBase36(uuid)
    const sentDate = +new Date()
    const errors: Array<string> = []
    const year = moment().year()

    return getFederaton(invoices, this.insuranceApi).then(fed => {
      return (prefixer
        ? prefixer(fed, hcp.id!)
        : Promise.resolve(
            `efact:${hcp.id}:${year}:${
              fed.code === "306" ? "300" : fed.code === "675" ? "600" : fed.code
            }:`
          )
      ).then(prefix => {
        return this.entityReferenceApi
          .getLatest(prefix)
          .then(
            (er: EntityReference) =>
              er && er.id && er.id!.startsWith(prefix)
                ? (Number(er.id!.split(":").pop()) || 0) + 1
                : 1,
            (e: XHR.XHRError) => {
              if (e.statusCode === 404) return 1
              else throw e
            }
          )
          .then((nextSeqNumber: number) =>
            this.entityReferenceApi.createEntityReference(
              new EntityReference({
                id: prefix + _.padStart("" + (nextSeqNumber % 1000000000), 9, "0"),
                docId: uuid
              })
            )
          )
          .then(er =>
            toInvoiceBatch(
              invoices,
              hcp,
              fullBase36,
              er && er.id ? Number(er.id.substr(prefix.length)) % 1000 : 0,
              smallBase36,
              this.insuranceApi,
              this.invoiceXApi,
              this.api,
              speciality,
              professionCode
            )
          )
          .then(batch =>
            efactApi
              .sendBatchUsingPOST(xFHCKeystoreId, xFHCTokenId, xFHCPassPhrase, batch)
              //.then(() => { throw "ERREUR FORCEE" })
              .catch(err => {
                // The FHC has crashed but the batch could be sent, so be careful !
                const errorMessage = _.get(
                  err,
                  "message",
                  err.toString ? err.toString() : "Server error"
                )
                const blockingErrors = [
                  "Gateway Timeout", // based on the user feedback (including Frederic)
                  "Failed to fetch" // is due to internet connection lost (shutdown wifi just before sending batch)
                ]

                if (_.includes(blockingErrors, errorMessage.trim())) {
                  throw errorMessage
                }
                return { error: errorMessage }
              })
              .then((r: EfactSendResponse | { success?: string; error: string }) => {
                const res = r as EfactSendResponseWithError
                if (res.success || res.error) {
                  let promise = Promise.resolve(true)
                  let totalAmount = 0
                  _.forEach(invoices, iv => {
                    promise = promise.then(() => {
                      _.forEach(iv.invoice.invoicingCodes, code => {
                        code.pending = true // STATUS_PENDING
                        totalAmount += code.reimbursement || 0
                      })
                      iv.invoice.sentDate = sentDate
                      return !!this.invoiceXApi.modifyInvoice(iv.invoice).catch(() => {
                        errors.push(`efac-management.CANNOT_UPDATE_INVOICE.${iv.invoice.id}`)
                      })
                    })
                  })
                  return promise
                    .then(() =>
                      this.api.newInstance(user, {
                        id: uuid,
                        medicalLocationId,
                        invoiceIds: invoices.map(i => i.invoice.id),
                        // tslint:disable-next-line:no-bitwise
                        status: 1 << 6, // STATUS_EFACT
                        externalRef: _.padStart("" + batch.uniqueSendNumber, 3, "0"),
                        transportGuid: "EFACT:BATCH:" + batch.numericalRef,
                        sent: timeEncode(new Date()),
                        fromHealthcarePartyId: hcp.id,
                        recipients: [fed.id],
                        recipientsType: "org.taktik.icure.entities.Insurance"
                      })
                    )
                    .then(message =>
                      this.api.createMessage(
                        Object.assign(message, {
                          sent: sentDate,
                          status:
                            (message.status || 0) | (res.success ? 1 << 7 : 0) /*STATUS_SENT*/,
                          metas: {
                            ioFederationCode: batch.ioFederationCode,
                            numericalRef: batch.numericalRef,
                            invoiceMonth: _.padStart("" + batch.invoicingMonth, 2, "0"),
                            invoiceYear: _.padStart("" + batch.invoicingYear, 4, "0"),
                            totalAmount: totalAmount,
                            fhc_server: fhcServer,
                            errors: res.error
                          }
                        })
                      )
                    )
                    .then((msg: Message) => {
                      if (res.success) {
                        // Continue even if error ...
                        this.saveMessageAttachment(user, msg, res)
                      }
                      return msg
                    })
                } else {
                  throw "Cannot send batch"
                }
              })
          )
          .catch(err => {
            console.log(err)
            errors.push(err)
            throw new Error(errors.join(","))
          })
      })
    })
  }

  saveMessageAttachment(user: User, msg: Message, res: EfactSendResponseWithError) {
    return Promise.all([
      this.documentXApi.newInstance(user, msg, {
        mainUti: "public.json",
        name: "920000_records"
      }),
      this.documentXApi.newInstance(user, msg, {
        mainUti: "public.plain-text",
        name: "920000"
      })
    ])
      .then(([jsonDoc, doc]) =>
        Promise.all([
          this.documentXApi.createDocument(jsonDoc),
          this.documentXApi.createDocument(doc)
        ])
      )
      .then(([jsonDoc, doc]) =>
        Promise.all([
          this.documentXApi.setDocumentAttachment(
            jsonDoc.id!!,
            undefined /*TODO provide keys for encryption*/,
            <any>ua2ab(string2ua(JSON.stringify(res.records!!)))
          ),
          this.documentXApi.setDocumentAttachment(
            doc.id!!,
            undefined /*TODO provide keys for encryption*/,
            <any>ua2ab(string2ua(res.detail!!))
          )
        ])
      )
      .then(() =>
        this.receiptXApi.iccApi.logReceipt(
          user,
          msg.id!!,
          [
            `mycarenet:efact:inputReference:${res.inputReference}`,
            res.tack!!.appliesTo!!,
            res.tack!!.reference!!
          ],
          "tack",
          ua2ab(string2ua(JSON.stringify(res.tack)))
        )
      )
  }
}
