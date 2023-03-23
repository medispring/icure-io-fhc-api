import { HealthcareParty, Invoice, Patient, Message } from "@icure/api"

import {
  IccInvoiceXApi,
  IccMessageXApi,
  IccInsuranceApi,
  Insurance,
  InvoicingCode,
  ListOfIds
} from "@icure/api"

import { InvoicesBatch, InvoiceItem, Invoice as EfactInvoice, EIDItem } from "../../model/models"
import { dateEncode, toMoment } from "./formatting-util"
import { toPatient } from "./fhc-patient-util"
import { toInvoiceSender } from "./fhc-invoice-sender-util"
import { isPatientHospitalized, getInsurability } from "./insurability-util"
import * as _ from "lodash"
import * as moment from "moment"
import { UuidEncoder } from "./uuid-encoder"

export interface RelatedInvoiceInfo {
  invoiceId: string
  invoiceReference?: string
  sendNumber?: string
  insuranceCode?: string
  invoicingYear?: string
  invoicingMonth?: string
}

export interface InvoiceWithPatient {
  patient: Patient
  invoice: Invoice
  aggregatedInvoice?: Invoice
}

const base36UUID = new UuidEncoder()

function ensureNoFederation(invoices: Array<InvoiceWithPatient>, insurances: Array<Insurance>) {
  // We will check here for recipient which are federations (except 306).

  const federations = insurances.filter(
    i => i.code !== "306" && i.code !== "675" && i.id === i.parent
  )

  if (federations.length > 0) {
    console.error(
      `Invoices directed to ${federations.map(i => i.code).join()}, invoices ${invoices.map(
        i => i.invoice.id
      )}`
    )
    throw "Some invoices are directly destinated to federations inside of mutuality office !"
  }
}

export function getFederaton(
  invoices: Array<InvoiceWithPatient>,
  insuranceApi: IccInsuranceApi
): Promise<Insurance> {
  return insuranceApi
    .getInsurances(
      new ListOfIds({
        ids: _.compact(invoices.map(iwp => iwp.invoice.recipientId))
      })
    )
    .then((insurances: Array<Insurance>) => {
      ensureNoFederation(invoices, insurances)

      return insuranceApi
        .getInsurances(new ListOfIds({ ids: _.uniq(_.compact(insurances.map(i => i.parent))) }))
        .then((parents: Array<Insurance>) => {
          const parentsWithFedCode = parents.filter(i => i.code)

          if (!parentsWithFedCode.length) {
            throw "The federation is missing from the recipients of the invoices"
          }

          if (parentsWithFedCode.length > 1) {
            throw "The provided invoices are not addressed to insurances belonging to the same federation"
          }

          return parentsWithFedCode[0]
        })
    })
}

export function getRelatedInvoicesInfo(
  invoicesWithPatient: InvoiceWithPatient[],
  insuranceApi: IccInsuranceApi,
  invoiceXApi: IccInvoiceXApi,
  messageXApi: IccMessageXApi
) {
  // Return the id of the related parentInvoice
  const getRelatedInvoiceId = (iv: Invoice) =>
    (iv.creditNote && iv.creditNoteRelatedInvoiceId) || iv.correctedInvoiceId

  return Promise.resolve(invoicesWithPatient).then(invoicesWithPatient => {
    const invoices = _(invoicesWithPatient)
      .map(iwp => iwp.invoice)
      .filter(piv => !!getRelatedInvoiceId(piv))
      .value()

    if (invoices.length === 0) {
      return Promise.resolve([])
    }

    const relatedInvoiceIds = new ListOfIds({
      ids: invoices.map(iv => getRelatedInvoiceId(iv))
    })

    return Promise.all([
      messageXApi.listMessagesByInvoiceIds(relatedInvoiceIds),
      invoiceXApi.getInvoices(relatedInvoiceIds)
    ]).then(result => {
      const messages: Message[] = result[0]
      const relatedInvoices: Invoice[] = result[1]
      const insuranceIds = _(relatedInvoices)
        .map(civ => civ.recipientId)
        .uniq()
        .value()

      return insuranceApi
        .getInsurances(new ListOfIds({ ids: insuranceIds }))
        .then((insurances: Insurance[]) => {
          const relatedInvoicesInfo: RelatedInvoiceInfo[] = []

          _.forEach(invoices, invoice => {
            const relatedInvoice = _.find(
              relatedInvoices,
              riv => !!(riv.id === getRelatedInvoiceId(invoice))
            )
            const message = _.find(
              messages,
              m => !!(relatedInvoice && m.invoiceIds!!.indexOf(relatedInvoice.id!!) > -1)
            )
            const insurance = _.find(
              insurances,
              ins => !!(relatedInvoice && ins.id === relatedInvoice.recipientId)
            )

            if (!relatedInvoice || !message || !insurance) return

            relatedInvoicesInfo.push({
              invoiceId: invoice.id!!,
              insuranceCode: insurance.code,
              invoiceReference: relatedInvoice.invoiceReference,
              sendNumber: message.externalRef,
              invoicingYear: _.padStart(message.metas!!.invoiceYear, 4, "0"),
              invoicingMonth: _.padStart(message.metas!!.invoiceMonth, 2, "0")
            })
          })

          return relatedInvoicesInfo
        })
    })
  })
}

// Here we trust the invoices argument for grouping validity (month, year and patient)
export function toInvoiceBatch(
  invoicesWithPatient: Array<InvoiceWithPatient>,
  hcp: HealthcareParty,
  batchRef: string,
  batchNumber: number,
  fileRef: string,
  insuranceApi: IccInsuranceApi,
  invoiceXApi: IccInvoiceXApi,
  messageXApi: IccMessageXApi,
  speciality: string
): Promise<InvoicesBatch> {
  return insuranceApi
    .getInsurances(
      new ListOfIds({
        ids: _.compact(invoicesWithPatient.map(iwp => iwp.invoice.recipientId))
      })
    )
    .then((insurances: Array<Insurance>) => {
      ensureNoFederation(invoicesWithPatient, insurances)

      return insuranceApi
        .getInsurances(new ListOfIds({ ids: _.uniq(_.compact(insurances.map(i => i.parent))) }))
        .then((parents: Array<Insurance>) => {
          const fedCodes = _.compact(parents.map(i => i.code && i.code.substr(0, 3)))
          if (!fedCodes.length) {
            throw "The federation is missing from the recipients of the invoices"
          }
          if (fedCodes.length > 1) {
            throw "The provided invoices are not addressed to insurances belonging to the same federation"
          }

          return getRelatedInvoicesInfo(
            invoicesWithPatient,
            insuranceApi,
            invoiceXApi,
            messageXApi
          ).then((relatedInvoicesInfo: RelatedInvoiceInfo[]) => {
            const invoicesBatch = new InvoicesBatch({})

            invoicesBatch.batchRef = batchRef
            invoicesBatch.fileRef = fileRef
            invoicesBatch.magneticInvoice = speciality === "medicalhouse" //flatrateInvoice have some different fields
            speciality === "medicalhouse"
              ? (invoicesBatch.invoiceContent = 0)
              : speciality === "midwife"
              ? (invoicesBatch.invoiceContent = 50)
              : null
            invoicesBatch.invoices = _.map(
              invoicesWithPatient,
              (invWithPat: InvoiceWithPatient) => {
                const invoice = invWithPat.aggregatedInvoice || invWithPat.invoice
                const relatedInvoiceInfo = _.find(
                  relatedInvoicesInfo,
                  rivi => rivi.invoiceId === invoice.id
                )
                const insurance = insurances.find(ins => ins.id === invoice.recipientId)
                if (!insurance) {
                  throw "Insurance is invalid for patient " + invWithPat.patient.id
                }

                return toInvoice(
                  hcp.nihii!!,
                  invoice,
                  invWithPat.patient,
                  insurance,
                  relatedInvoiceInfo,
                  speciality
                )
              }
            )

            const now = new Date()
            const invoiceDates = _.groupBy(
              invoicesWithPatient.map(
                inv => (inv?.invoice?.invoiceDate ?? 100001).toString().substring(0, 6) + "01"
              )
            )
            //The invoiceMonth/Year of the batch must be equal to the most recent month/year of the invoices that has the highest count within the batch.
            //From the INAMI Rules: (https://www.riziv.fgov.be/SiteCollectionDocuments/instructions_facturation_electronique_2021.pdf page 213)
            // In deze zone bedoelt men de maand waarin het merendeel der prestaties, die op deze factuur staan,
            // werden verricht. Deze maand kan verschillend zijn van de maand waarin de factuur werd opgemaakt
            //Examples:
            //A. 10 invoices 02/2020, 10 invoices 03/2020, 5 invoices 04/2020 --> 03/2020
            //B. 10 invoices 02/2020;  9 invoices 03/2020, 5 invoices 04/2020 --> 02/2020
            let dateCounts: any[] = []
            _.forOwn(invoiceDates, function(val, key) {
              dateCounts.push({ date: key, count: val.length })
            })
            const invoiceDate = toMoment(
              _.get(
                _.head(_.orderBy(dateCounts, ["count", "date"], ["desc", "desc"])),
                "date",
                invoicesWithPatient[0].invoice.invoiceDate!!
              )
            )
            const invoicingMonth = !!invoiceDate ? invoiceDate.month() + 1 : 0
            const invoicingYear = !!invoiceDate ? invoiceDate.year() : 0

            // The OA 500, matches the monthYear (zone 300) to check the batch sending number
            // Use sending year to prevent duplicate sending number in case of invoices made
            // on the previous year
            if (now.getFullYear() === invoicingYear) {
              invoicesBatch.invoicingMonth = invoicingMonth
              invoicesBatch.invoicingYear = invoicingYear
            } else {
              invoicesBatch.invoicingMonth = now.getMonth() + 1
              invoicesBatch.invoicingYear = now.getFullYear()
            }

            invoicesBatch.ioFederationCode = fedCodes[0]
            invoicesBatch.numericalRef =
              moment().get("year") * 1000000 + Number(fedCodes[0]) * 1000 + batchNumber
            invoicesBatch.sender = toInvoiceSender(hcp, fedCodes[0])
            invoicesBatch.uniqueSendNumber = batchNumber

            return invoicesBatch
          })
        })
    })
}

function toInvoice(
  nihiiHealthcareProvider: string,
  invoice: Invoice,
  patient: Patient,
  insurance: Insurance,
  relatedInvoiceInfo: RelatedInvoiceInfo | undefined,
  speciality: string
): EfactInvoice {
  const efactInvoice = new EfactInvoice({})
  const invoiceYear = moment(invoice.created)
    .year()
    .toString()

  efactInvoice.hospitalisedPatient = isPatientHospitalized(patient)
  // FIXME : coder l'invoice ref
  efactInvoice.invoiceNumber = Number(invoiceYear + invoice.invoiceReference) || 0
  // FIXME : coder l'invoice ref
  efactInvoice.invoiceRef = uuidBase36(invoice.id!!)
  efactInvoice.ioCode = insurance.code!!.substr(0, 3)
  efactInvoice.items = _.map(invoice.invoicingCodes, (invoicingCode: InvoicingCode) => {
    return toInvoiceItem(
      invoice.supervisorNihii || nihiiHealthcareProvider,
      patient,
      invoice,
      invoicingCode,
      speciality
    )
  })
  efactInvoice.patient = toPatient(patient)
  efactInvoice.ignorePrescriptionDate = !!invoice.longDelayJustification
  efactInvoice.creditNote = invoice.creditNote

  if (relatedInvoiceInfo) {
    efactInvoice.relatedBatchSendNumber = Number(relatedInvoiceInfo.sendNumber)
    efactInvoice.relatedBatchYearMonth = Number(
      relatedInvoiceInfo.invoicingYear!! + relatedInvoiceInfo.invoicingMonth
    )
    efactInvoice.relatedInvoiceNumber = Number(
      relatedInvoiceInfo.invoicingYear!! + relatedInvoiceInfo.invoiceReference
    )
    efactInvoice.relatedInvoiceIoCode = relatedInvoiceInfo.insuranceCode
  }

  // TODO : fix me later
  efactInvoice.reason = EfactInvoice.ReasonEnum.Other
  efactInvoice.creditNote = invoice.creditNote
  if (speciality === "medicalhouse") {
    efactInvoice.startOfCoveragePeriod = invoice.invoicingCodes!![0].contractDate
  }

  if (invoice?.locationNihii) {
    efactInvoice.locationNihii = invoice?.locationNihii
    efactInvoice.locationService = invoice?.locationService
    efactInvoice.admissionDate = invoice?.admissionDate
  }

  return efactInvoice
}

function toInvoiceItem(
  nihiiHealthcareProvider: string,
  patient: Patient,
  invoice: Invoice,
  invoicingCode: InvoicingCode,
  speciality: string
): InvoiceItem {
  const invoiceItem = new InvoiceItem({})
  invoiceItem.codeNomenclature = Number(invoicingCode.tarificationId!!.split("|")[1])
  invoiceItem.dateCode = dateEncode(toMoment(invoicingCode.dateCode!!)!!.toDate())
  // Only applies to flatrate invoicing (https://medispring.atlassian.net/wiki/spaces/EN/pages/2536013825/Behavior+of+diabetes+pre-care+pathways+flatrate+invoicing)
  if (speciality === "medicalhouse") {
    invoiceItem.endDateCode =
      invoiceItem.codeNomenclature === 109594 // Diabetes pre-care pathways
        ? dateEncode(toMoment(invoicingCode.dateCode!!)!!.toDate())
        : dateEncode(
            toMoment(invoicingCode.dateCode!!)!!
              .endOf("month")
              .toDate()
          )
  }
  invoiceItem.doctorIdentificationNumber = nihiiHealthcareProvider
  invoiceItem.doctorSupplement = Number(((invoicingCode.doctorSupplement || 0) * 100).toFixed(0))
  if (invoicingCode.eidReadingHour && invoicingCode.eidReadingValue) {
    invoiceItem.eidItem = new EIDItem({
      deviceType: "1",
      readType: "1",
      readDate: invoiceItem.dateCode,
      readHour: invoicingCode.eidReadingHour,
      readvalue: invoicingCode.eidReadingValue
    })
  }
  invoiceItem.gnotionNihii = invoice.gnotionNihii
  invoiceItem.insuranceRef = invoicingCode.contract || undefined // Must be != ""
  invoiceItem.insuranceRefDate = invoicingCode.contractDate || invoiceItem.dateCode
  invoiceItem.invoiceRef = uuidBase36(invoicingCode.id!!)

  invoiceItem.override3rdPayerCode = invoicingCode.override3rdPayerCode
  invoiceItem.patientFee = Number(((invoicingCode.patientIntervention || 0) * 100).toFixed(0))
  invoiceItem.percentNorm = getPercentNorm(invoicingCode.percentNorm || 0)
  invoiceItem.personalInterventionCoveredByThirdPartyCode =
    invoicingCode.cancelPatientInterventionReason
  invoiceItem.prescriberNihii = invoicingCode.prescriberNihii
  invoiceItem.prescriptionDate = invoicingCode.prescriptionDate
  invoiceItem.prescriberNorm = getPrescriberNorm(invoicingCode.prescriberNorm || 0)
  invoiceItem.reimbursedAmount = Number(((invoicingCode.reimbursement || 0) * 100).toFixed(0))
  invoiceItem.relatedCode = Number(invoicingCode.relatedCode || 0)
  invoiceItem.sideCode = getSideCode(invoicingCode.side || 0)
  invoiceItem.timeOfDay = getTimeOfDay(invoicingCode.timeOfDay || 0)
  invoiceItem.units = invoicingCode.units || 1
  invoiceItem.derogationMaxNumber = getDerogationMaxNumber(invoicingCode.derogationMaxNumber || 0)
  invoiceItem.internshipNihii = invoice.internshipNihii

  return invoiceItem
}

function getPercentNorm(norm: number) {
  return norm === 0
    ? InvoiceItem.PercentNormEnum.None
    : norm === 1
    ? InvoiceItem.PercentNormEnum.SurgicalAid1
    : norm === 2
    ? InvoiceItem.PercentNormEnum.SurgicalAid2
    : norm === 3
    ? InvoiceItem.PercentNormEnum.ReducedFee
    : norm === 4
    ? InvoiceItem.PercentNormEnum.Ah1n1
    : norm === 5
    ? InvoiceItem.PercentNormEnum.HalfPriceSecondAct
    : norm === 6
    ? InvoiceItem.PercentNormEnum.InvoiceException
    : norm === 7
    ? InvoiceItem.PercentNormEnum.ForInformation
    : InvoiceItem.PercentNormEnum.None
}

function getSideCode(code: number) {
  return code === 0
    ? InvoiceItem.SideCodeEnum.None
    : code === 1
    ? InvoiceItem.SideCodeEnum.Left
    : code === 2
    ? InvoiceItem.SideCodeEnum.Right
    : InvoiceItem.SideCodeEnum.None
}

function getTimeOfDay(code: number) {
  return code === 0
    ? InvoiceItem.TimeOfDayEnum.Other
    : code === 1
    ? InvoiceItem.TimeOfDayEnum.Night
    : code === 2
    ? InvoiceItem.TimeOfDayEnum.Weekend
    : code === 3
    ? InvoiceItem.TimeOfDayEnum.Bankholiday
    : code === 4
    ? InvoiceItem.TimeOfDayEnum.Urgent
    : InvoiceItem.TimeOfDayEnum.Other
}

function getPrescriberNorm(code: number) {
  return code === 0
    ? InvoiceItem.PrescriberNormEnum.None
    : code === 1
    ? InvoiceItem.PrescriberNormEnum.OnePrescriber
    : code === 3
    ? InvoiceItem.PrescriberNormEnum.SelfPrescriber
    : code === 4
    ? InvoiceItem.PrescriberNormEnum.AddedCode
    : code === 9
    ? InvoiceItem.PrescriberNormEnum.ManyPrescribers
    : InvoiceItem.PrescriberNormEnum.None
}

export function getDerogationMaxNumber(code: number): InvoiceItem.DerogationMaxNumberEnum {
  return code === 0
    ? InvoiceItem.DerogationMaxNumberEnum.Other
    : code === 1
    ? InvoiceItem.DerogationMaxNumberEnum.DerogationMaxNumber
    : code === 2
    ? InvoiceItem.DerogationMaxNumberEnum.OtherPrescription
    : code === 3
    ? InvoiceItem.DerogationMaxNumberEnum.SecondPrestationOfDay
    : InvoiceItem.DerogationMaxNumberEnum.ThirdAndNextPrestationOfDay
}

export function toDerogationMaxNumber(derogation: InvoiceItem.DerogationMaxNumberEnum): number {
  return derogation === InvoiceItem.DerogationMaxNumberEnum.Other
    ? 0
    : derogation === InvoiceItem.DerogationMaxNumberEnum.DerogationMaxNumber
    ? 1
    : derogation === InvoiceItem.DerogationMaxNumberEnum.OtherPrescription
    ? 2
    : derogation === InvoiceItem.DerogationMaxNumberEnum.SecondPrestationOfDay
    ? 3
    : 4
}

export function uuidBase36(uuid: string): string {
  return base36UUID.encode(uuid)
}

/**
 * This function encodes an uuid in 13 characters in base36, this is
 * for the fileRef in efact, zone 303
 */
export function uuidBase36Half(uuid: string): string {
  const rawEndcode = base36UUID.encode(uuid.substr(0, 18))
  return _.padStart(rawEndcode, 13, "0")
}

export function decodeBase36Uuid(base36: string): string | null {
  try {
    const decoded: string = base36UUID.decode(base36)
    if (base36.length !== 13) {
      return decoded
    } else {
      const truncated = decoded.substr(19, decoded.length)
      const raw = truncated.replace(/-/g, "")
      const formatted = raw.substr(0, 8) + "-" + raw.substring(8, 12) + "-" + raw.substring(12, 16)
      return formatted
    }
  } catch (e) {
    console.log("Cannot interpret: " + base36, e)
  }

  return null
}
