/**
 * Api Documentation
 * Api Documentation
 *
 * OpenAPI spec version: 1.0
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
import { EIDItem } from "./EIDItem"

import { decodeBase64 } from "./ModelHelper"

export class InvoiceItem {
  constructor(json: JSON | any) {
    Object.assign(this as InvoiceItem, json)
  }

  anatomy?: string
  codeNomenclature?: number
  dateCode?: number
  derogationMaxNumber?: InvoiceItem.DerogationMaxNumberEnum
  doctorIdentificationNumber?: string
  doctorSupplement?: number
  eidItem?: EIDItem
  endDateCode?: number
  gnotionNihii?: string
  insuranceRef?: string
  insuranceRefDate?: number
  internshipNihii?: string
  invoiceRef?: string
  override3rdPayerCode?: string
  patientFee?: number
  percentNorm?: InvoiceItem.PercentNormEnum
  personalInterventionCoveredByThirdPartyCode?: number
  prescriberNihii?: string
  prescriberNorm?: InvoiceItem.PrescriberNormEnum
  prescriptionDate?: number
  reimbursedAmount?: number
  relatedCode?: number
  sideCode?: InvoiceItem.SideCodeEnum
  timeOfDay?: InvoiceItem.TimeOfDayEnum
  transplantationCode?: InvoiceItem.TransplantationCodeEnum
  units?: number
}
export namespace InvoiceItem {
  export type DerogationMaxNumberEnum =
    | "Other"
    | "DerogationMaxNumber"
    | "OtherPrescription"
    | "SecondPrestationOfDay"
    | "ThirdAndNextPrestationOfDay"
  export const DerogationMaxNumberEnum = {
    Other: "Other" as DerogationMaxNumberEnum,
    DerogationMaxNumber: "DerogationMaxNumber" as DerogationMaxNumberEnum,
    OtherPrescription: "OtherPrescription" as DerogationMaxNumberEnum,
    SecondPrestationOfDay: "SecondPrestationOfDay" as DerogationMaxNumberEnum,
    ThirdAndNextPrestationOfDay: "ThirdAndNextPrestationOfDay" as DerogationMaxNumberEnum
  }
  export type PercentNormEnum =
    | "None"
    | "SurgicalAid1"
    | "SurgicalAid2"
    | "ReducedFee"
    | "Ah1n1"
    | "HalfPriceSecondAct"
    | "InvoiceException"
    | "ForInformation"
  export const PercentNormEnum = {
    None: "None" as PercentNormEnum,
    SurgicalAid1: "SurgicalAid1" as PercentNormEnum,
    SurgicalAid2: "SurgicalAid2" as PercentNormEnum,
    ReducedFee: "ReducedFee" as PercentNormEnum,
    Ah1n1: "Ah1n1" as PercentNormEnum,
    HalfPriceSecondAct: "HalfPriceSecondAct" as PercentNormEnum,
    InvoiceException: "InvoiceException" as PercentNormEnum,
    ForInformation: "ForInformation" as PercentNormEnum
  }
  export type PrescriberNormEnum =
    | "None"
    | "OnePrescriber"
    | "SelfPrescriber"
    | "AddedCode"
    | "OnePrescriberSubstituted"
    | "ManyPrescribersSubstituted"
    | "ManyPrescribers"
  export const PrescriberNormEnum = {
    None: "None" as PrescriberNormEnum,
    OnePrescriber: "OnePrescriber" as PrescriberNormEnum,
    SelfPrescriber: "SelfPrescriber" as PrescriberNormEnum,
    AddedCode: "AddedCode" as PrescriberNormEnum,
    OnePrescriberSubstituted: "OnePrescriberSubstituted" as PrescriberNormEnum,
    ManyPrescribersSubstituted: "ManyPrescribersSubstituted" as PrescriberNormEnum,
    ManyPrescribers: "ManyPrescribers" as PrescriberNormEnum
  }
  export type SideCodeEnum = "None" | "Left" | "Right"
  export const SideCodeEnum = {
    None: "None" as SideCodeEnum,
    Left: "Left" as SideCodeEnum,
    Right: "Right" as SideCodeEnum
  }
  export type TimeOfDayEnum = "Other" | "Night" | "Weekend" | "Bankholiday" | "Urgent"
  export const TimeOfDayEnum = {
    Other: "Other" as TimeOfDayEnum,
    Night: "Night" as TimeOfDayEnum,
    Weekend: "Weekend" as TimeOfDayEnum,
    Bankholiday: "Bankholiday" as TimeOfDayEnum,
    Urgent: "Urgent" as TimeOfDayEnum
  }
  export type TransplantationCodeEnum = "None" | "RefersToRecipient" | "RefersToDonor"
  export const TransplantationCodeEnum = {
    None: "None" as TransplantationCodeEnum,
    RefersToRecipient: "RefersToRecipient" as TransplantationCodeEnum,
    RefersToDonor: "RefersToDonor" as TransplantationCodeEnum
  }
}
