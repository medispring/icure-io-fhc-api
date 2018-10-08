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

import { XHR } from "./XHR"
import * as models from "../model/models"

export class fhcTherlinkcontrollerApi {
  host: string
  headers: Array<XHR.Header>
  constructor(host: string, headers: any) {
    this.host = host
    this.headers = Object.keys(headers).map(k => new XHR.Header(k, headers[k]))
  }

  setHeaders(h: Array<XHR.Header>) {
    this.headers = h
  }

  handleError(e: XHR.Data) {
    if (e.status == 401) throw Error("auth-failed")
    else throw Error("api-error" + e.status)
  }

  doesLinkExistUsingPOST(
    xFHCKeystoreId: string,
    xFHCTokenId: string,
    xFHCPassPhrase: string,
    therLink: models.TherapeuticLinkDto
  ): Promise<models.TherapeuticLinkDto | any> {
    let _body = null
    _body = therLink

    const _url = this.host + "/therlink/check" + "?ts=" + new Date().getTime()
    let headers = this.headers
    headers = headers
      .filter(h => h.header !== "Content-Type")
      .concat(new XHR.Header("Content-Type", "application/json"))
    headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId))
    headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId))
    headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase))
    return XHR.sendCommand("POST", _url, headers, _body)
      .then(doc => new models.TherapeuticLinkDto(doc.body as JSON))
      .catch(err => this.handleError(err))
  }
  getAllTherapeuticLinksUsingGET(
    xFHCKeystoreId: string,
    xFHCTokenId: string,
    xFHCPassPhrase: string,
    hcpNihii: string,
    hcpSsin: string,
    hcpFirstName: string,
    hcpLastName: string,
    patientSsin: string,
    patientFirstName: string,
    patientLastName: string,
    eidCardNumber?: string,
    isiCardNumber?: string,
    startDate?: Date,
    endDate?: Date,
    type?: string,
    sign?: boolean
  ): Promise<Array<models.TherapeuticLinkMessageDto> | any> {
    let _body = null

    const _url =
      this.host +
      "/therlink/{patientSsin}/{hcpNihii}"
        .replace("{hcpNihii}", hcpNihii + "")
        .replace("{patientSsin}", patientSsin + "") +
      "?ts=" +
      new Date().getTime() +
      (hcpSsin ? "&hcpSsin=" + hcpSsin : "") +
      (hcpFirstName ? "&hcpFirstName=" + hcpFirstName : "") +
      (hcpLastName ? "&hcpLastName=" + hcpLastName : "") +
      (patientFirstName ? "&patientFirstName=" + patientFirstName : "") +
      (patientLastName ? "&patientLastName=" + patientLastName : "") +
      (eidCardNumber ? "&eidCardNumber=" + eidCardNumber : "") +
      (isiCardNumber ? "&isiCardNumber=" + isiCardNumber : "") +
      (startDate ? "&startDate=" + startDate : "") +
      (endDate ? "&endDate=" + endDate : "") +
      (type ? "&type=" + type : "") +
      (sign ? "&sign=" + sign : "")
    let headers = this.headers
    headers = headers
      .filter(h => h.header !== "Content-Type")
      .concat(new XHR.Header("Content-Type", "application/json"))
    headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId))
    headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId))
    headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase))
    return XHR.sendCommand("GET", _url, headers, _body)
      .then(doc => (doc.body as Array<JSON>).map(it => new models.TherapeuticLinkMessageDto(it)))
      .catch(err => this.handleError(err))
  }
  getAllTherapeuticLinksWithQueryLinkUsingPOST(
    xFHCKeystoreId: string,
    xFHCTokenId: string,
    xFHCPassPhrase: string,
    queryLink: models.TherapeuticLinkDto,
    sign?: boolean
  ): Promise<Array<models.TherapeuticLinkMessageDto> | any> {
    let _body = null
    _body = queryLink

    const _url =
      this.host + "/therlink/query" + "?ts=" + new Date().getTime() + (sign ? "&sign=" + sign : "")
    let headers = this.headers
    headers = headers
      .filter(h => h.header !== "Content-Type")
      .concat(new XHR.Header("Content-Type", "application/json"))
    headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId))
    headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId))
    headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase))
    return XHR.sendCommand("POST", _url, headers, _body)
      .then(doc => (doc.body as Array<JSON>).map(it => new models.TherapeuticLinkMessageDto(it)))
      .catch(err => this.handleError(err))
  }
  registerTherapeuticLinkUsingPOST1(
    xFHCKeystoreId: string,
    xFHCTokenId: string,
    xFHCPassPhrase: string,
    hcpNihii: string,
    hcpSsin: string,
    hcpFirstName: string,
    hcpLastName: string,
    patientSsin: string,
    patientFirstName: string,
    patientLastName: string,
    eidCardNumber?: string,
    isiCardNumber?: string,
    start?: Date,
    end?: Date,
    therLinkType?: string,
    comment?: string,
    sign?: boolean
  ): Promise<models.TherapeuticLinkMessageDto | any> {
    let _body = null

    const _url =
      this.host +
      "/therlink/register" +
      "?ts=" +
      new Date().getTime() +
      (hcpNihii ? "&hcpNihii=" + hcpNihii : "") +
      (hcpSsin ? "&hcpSsin=" + hcpSsin : "") +
      (hcpFirstName ? "&hcpFirstName=" + hcpFirstName : "") +
      (hcpLastName ? "&hcpLastName=" + hcpLastName : "") +
      (patientSsin ? "&patientSsin=" + patientSsin : "") +
      (patientFirstName ? "&patientFirstName=" + patientFirstName : "") +
      (patientLastName ? "&patientLastName=" + patientLastName : "") +
      (eidCardNumber ? "&eidCardNumber=" + eidCardNumber : "") +
      (isiCardNumber ? "&isiCardNumber=" + isiCardNumber : "") +
      (start ? "&start=" + start : "") +
      (end ? "&end=" + end : "") +
      (therLinkType ? "&therLinkType=" + therLinkType : "") +
      (comment ? "&comment=" + comment : "") +
      (sign ? "&sign=" + sign : "")
    let headers = this.headers
    headers = headers
      .filter(h => h.header !== "Content-Type")
      .concat(new XHR.Header("Content-Type", "application/json"))
    headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId))
    headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId))
    headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase))
    return XHR.sendCommand("POST", _url, headers, _body)
      .then(doc => new models.TherapeuticLinkMessageDto(doc.body as JSON))
      .catch(err => this.handleError(err))
  }
  revokeLinkUsingPOST(
    xFHCKeystoreId: string,
    xFHCTokenId: string,
    xFHCPassPhrase: string,
    hcpNihii: string,
    hcpSsin: string,
    hcpFirstName: string,
    hcpLastName: string,
    patientSsin: string,
    patientFirstName: string,
    patientLastName: string,
    eidCardNumber?: string,
    isiCardNumber?: string,
    start?: Date,
    end?: Date,
    therLinkType?: string,
    comment?: string,
    sign?: boolean
  ): Promise<models.TherapeuticLinkMessageDto | any> {
    let _body = null

    const _url =
      this.host +
      "/therlink/revoke/{patientSsin}/{hcpNihii}"
        .replace("{hcpNihii}", hcpNihii + "")
        .replace("{patientSsin}", patientSsin + "") +
      "?ts=" +
      new Date().getTime() +
      (hcpSsin ? "&hcpSsin=" + hcpSsin : "") +
      (hcpFirstName ? "&hcpFirstName=" + hcpFirstName : "") +
      (hcpLastName ? "&hcpLastName=" + hcpLastName : "") +
      (patientFirstName ? "&patientFirstName=" + patientFirstName : "") +
      (patientLastName ? "&patientLastName=" + patientLastName : "") +
      (eidCardNumber ? "&eidCardNumber=" + eidCardNumber : "") +
      (isiCardNumber ? "&isiCardNumber=" + isiCardNumber : "") +
      (start ? "&start=" + start : "") +
      (end ? "&end=" + end : "") +
      (therLinkType ? "&therLinkType=" + therLinkType : "") +
      (comment ? "&comment=" + comment : "") +
      (sign ? "&sign=" + sign : "")
    let headers = this.headers
    headers = headers
      .filter(h => h.header !== "Content-Type")
      .concat(new XHR.Header("Content-Type", "application/json"))
    headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId))
    headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId))
    headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase))
    return XHR.sendCommand("POST", _url, headers, _body)
      .then(doc => new models.TherapeuticLinkMessageDto(doc.body as JSON))
      .catch(err => this.handleError(err))
  }
  revokeLinkUsingPOST1(
    xFHCKeystoreId: string,
    xFHCTokenId: string,
    xFHCPassPhrase: string,
    therLink: models.TherapeuticLinkDto,
    sign?: boolean
  ): Promise<models.TherapeuticLinkMessageDto | any> {
    let _body = null
    _body = therLink

    const _url =
      this.host + "/therlink/revoke" + "?ts=" + new Date().getTime() + (sign ? "&sign=" + sign : "")
    let headers = this.headers
    headers = headers
      .filter(h => h.header !== "Content-Type")
      .concat(new XHR.Header("Content-Type", "application/json"))
    headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId))
    headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId))
    headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase))
    return XHR.sendCommand("POST", _url, headers, _body)
      .then(doc => new models.TherapeuticLinkMessageDto(doc.body as JSON))
      .catch(err => this.handleError(err))
  }
}
