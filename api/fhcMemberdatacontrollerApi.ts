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

export class fhcMemberdatacontrollerApi {
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

  getMemberDataByMembershipUsingGET(
    io: string,
    ioMembership: string,
    xFHCTokenId: string,
    xFHCKeystoreId: string,
    xFHCPassPhrase: string,
    hcpNihii: string,
    hcpSsin: string,
    hcpName: string,
    hcpQuality?: string,
    date?: number,
    endDate?: number,
    hospitalized?: boolean
  ): Promise<models.MemberDataResponse | any> {
    let _body = null

    const _url =
      this.host +
      "/mda/{io}/{ioMembership}"
        .replace("{io}", io + "")
        .replace("{ioMembership}", ioMembership + "") +
      "?ts=" +
      new Date().getTime() +
      (hcpNihii ? "&hcpNihii=" + hcpNihii : "") +
      (hcpSsin ? "&hcpSsin=" + hcpSsin : "") +
      (hcpName ? "&hcpName=" + hcpName : "") +
      (hcpQuality ? "&hcpQuality=" + hcpQuality : "") +
      (date ? "&date=" + date : "") +
      (endDate ? "&endDate=" + endDate : "") +
      (hospitalized ? "&hospitalized=" + hospitalized : "")
    let headers = this.headers
    headers = headers
      .filter(h => h.header !== "Content-Type")
      .concat(new XHR.Header("Content-Type", "application/json"))
    headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId))
    headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId))
    headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase))
    return XHR.sendCommand("GET", _url, headers, _body)
      .then(doc => new models.MemberDataResponse(doc.body as JSON))
      .catch(err => this.handleError(err))
  }
  getMemberDataUsingGET(
    ssin: string,
    xFHCTokenId: string,
    xFHCKeystoreId: string,
    xFHCPassPhrase: string,
    hcpNihii: string,
    hcpSsin: string,
    hcpName: string,
    hcpQuality?: string,
    date?: number,
    endDate?: number,
    hospitalized?: boolean
  ): Promise<models.MemberDataResponse | any> {
    let _body = null

    const _url =
      this.host +
      "/mda/{ssin}".replace("{ssin}", ssin + "") +
      "?ts=" +
      new Date().getTime() +
      (hcpNihii ? "&hcpNihii=" + hcpNihii : "") +
      (hcpSsin ? "&hcpSsin=" + hcpSsin : "") +
      (hcpName ? "&hcpName=" + hcpName : "") +
      (hcpQuality ? "&hcpQuality=" + hcpQuality : "") +
      (date ? "&date=" + date : "") +
      (endDate ? "&endDate=" + endDate : "") +
      (hospitalized ? "&hospitalized=" + hospitalized : "")
    let headers = this.headers
    headers = headers
      .filter(h => h.header !== "Content-Type")
      .concat(new XHR.Header("Content-Type", "application/json"))
    headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId))
    headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId))
    headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase))
    return XHR.sendCommand("GET", _url, headers, _body)
      .then(doc => new models.MemberDataResponse(doc.body as JSON))
      .catch(err => this.handleError(err))
  }
  queryMemberDataByMembershipUsingPOST(
    io: string,
    ioMembership: string,
    xFHCTokenId: string,
    xFHCKeystoreId: string,
    xFHCPassPhrase: string,
    hcpNihii: string,
    hcpSsin: string,
    hcpName: string,
    facets: Array<models.FacetDto>,
    hcpQuality?: string,
    date?: number,
    endDate?: number,
    hospitalized?: boolean
  ): Promise<models.MemberDataResponse | any> {
    let _body = null
    _body = facets

    const _url =
      this.host +
      "/mda/{io}/{ioMembership}"
        .replace("{io}", io + "")
        .replace("{ioMembership}", ioMembership + "") +
      "?ts=" +
      new Date().getTime() +
      (hcpNihii ? "&hcpNihii=" + hcpNihii : "") +
      (hcpSsin ? "&hcpSsin=" + hcpSsin : "") +
      (hcpName ? "&hcpName=" + hcpName : "") +
      (hcpQuality ? "&hcpQuality=" + hcpQuality : "") +
      (date ? "&date=" + date : "") +
      (endDate ? "&endDate=" + endDate : "") +
      (hospitalized ? "&hospitalized=" + hospitalized : "")
    let headers = this.headers
    headers = headers
      .filter(h => h.header !== "Content-Type")
      .concat(new XHR.Header("Content-Type", "application/json"))
    headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId))
    headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId))
    headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase))
    return XHR.sendCommand("POST", _url, headers, _body)
      .then(doc => new models.MemberDataResponse(doc.body as JSON))
      .catch(err => this.handleError(err))
  }
  queryMemberDataUsingPOST(
    ssin: string,
    xFHCTokenId: string,
    xFHCKeystoreId: string,
    xFHCPassPhrase: string,
    hcpNihii: string,
    hcpSsin: string,
    hcpName: string,
    facets: Array<models.FacetDto>,
    hcpQuality?: string,
    date?: number,
    endDate?: number,
    hospitalized?: boolean
  ): Promise<models.MemberDataResponse | any> {
    let _body = null
    _body = facets

    const _url =
      this.host +
      "/mda/{ssin}".replace("{ssin}", ssin + "") +
      "?ts=" +
      new Date().getTime() +
      (hcpNihii ? "&hcpNihii=" + hcpNihii : "") +
      (hcpSsin ? "&hcpSsin=" + hcpSsin : "") +
      (hcpName ? "&hcpName=" + hcpName : "") +
      (hcpQuality ? "&hcpQuality=" + hcpQuality : "") +
      (date ? "&date=" + date : "") +
      (endDate ? "&endDate=" + endDate : "") +
      (hospitalized ? "&hospitalized=" + hospitalized : "")
    let headers = this.headers
    headers = headers
      .filter(h => h.header !== "Content-Type")
      .concat(new XHR.Header("Content-Type", "application/json"))
    headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId))
    headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId))
    headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase))
    return XHR.sendCommand("POST", _url, headers, _body)
      .then(doc => new models.MemberDataResponse(doc.body as JSON))
      .catch(err => this.handleError(err))
  }
}
