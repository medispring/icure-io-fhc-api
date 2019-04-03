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
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as models from "./models"

export class Invoice {
  constructor(json: JSON | any) {
    Object.assign(this as Invoice, json)
  }
  creditNote?: boolean

  gnotionNihii?: string

  hospitalisedPatient?: boolean

  ignorePrescriptionDate?: boolean

  internshipNihii?: string

  invoiceNumber?: number

  invoiceRef?: string

  ioCode?: string

  items?: Array<models.InvoiceItem>

  patient?: models.Patient

  reason?: Invoice.ReasonEnum

  relatedBatchSendNumber?: number

  relatedBatchYearMonth?: number

  relatedInvoiceIoCode?: string

  relatedInvoiceNumber?: number

  startOfCoveragePeriod?: number
}
export namespace Invoice {
  export enum ReasonEnum {
    Chimiotherapy = <any>"Chimiotherapy",
    ProfessionalDisease = <any>"ProfessionalDisease",
    WorkAccident = <any>"WorkAccident",
    Accident = <any>"Accident",
    Other = <any>"Other"
  }
}
