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

export class VerseInfos {
  constructor(json: JSON | any) {
    Object.assign(this as VerseInfos, json)
  }
  agreementRenewalMax?: number

  agreementTerm?: number

  agreementTermUnit?: string

  agreementYearMax?: number

  andClauseNum?: number

  chapterName?: string

  checkBoxInd?: string

  createdTms?: Date

  createdUserId?: string

  endDate?: Date

  id?: number

  legalReference?: string

  maxPackageNumber?: number

  maximumAgeAuthorized?: number

  maximumAgeAuthorizedUnit?: string

  maximumContentQuantity?: number

  maximumContentUnit?: string

  maximumDurationQuantity?: number

  maximumDurationUnit?: string

  maximumStrengthQuantity?: number

  maximumStrengthUnit?: string

  minCheckNum?: number

  minimumAgeAuthorized?: number

  minimumAgeAuthorizedUnit?: string

  modificationDate?: Date

  modificationStatus?: string

  otherAddedDocumentInd?: string

  paragraphName?: string

  purchasingAdvisorQualList?: string

  requestType?: string

  sexRestricted?: string

  startDate?: Date

  textFr?: string

  textNl?: string

  verseLevel?: number

  verseNum?: number

  verseSeq?: number

  verseSeqParent?: number

  verseType?: string

  verses?: Array<models.VerseInfos>
}
