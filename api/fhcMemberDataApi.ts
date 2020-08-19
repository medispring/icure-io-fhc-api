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
import { XHR } from "./XHR"
import { FacetDto } from "../model/FacetDto"
import { GenAsyncResponse } from "../model/GenAsyncResponse"
import { MemberDataBatchRequestDto } from "../model/MemberDataBatchRequestDto"
import { MemberDataList } from "../model/MemberDataList"
import { MemberDataResponse } from "../model/MemberDataResponse"

export class fhcMemberDataApi {
  host: string
  headers: Array<XHR.Header>
  fetchImpl?: (input: RequestInfo, init?: RequestInit) => Promise<Response>

  constructor(
    host: string,
    headers: any,
    fetchImpl?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ) {
    this.host = host
    this.headers = Object.keys(headers).map(k => new XHR.Header(k, headers[k]))
    this.fetchImpl = fetchImpl
  }

  setHeaders(h: Array<XHR.Header>) {
    this.headers = h
  }

  handleError(e: XHR.XHRError): never {
    throw e
  }

  /**
   *
   * @summary confirmMemberDataAcksAsync
   * @param body mdaAcksHashes
   * @param xFHCTokenId X-FHC-tokenId
   * @param xFHCKeystoreId X-FHC-keystoreId
   * @param xFHCPassPhrase X-FHC-passPhrase
   * @param hcpNihii hcpNihii
   * @param hcpName hcpName
   */
  confirmMemberDataAcksAsyncUsingPOST(
    xFHCTokenId: string,
    xFHCKeystoreId: string,
    xFHCPassPhrase: string,
    hcpNihii: string,
    hcpName: string,
    body?: Array<string>
  ): Promise<boolean> {
    let _body = null
    _body = body

    const _url =
      this.host +
      `/mda/async/confirm/acks` +
      "?ts=" +
      new Date().getTime() +
      (hcpNihii ? "&hcpNihii=" + encodeURIComponent(String(hcpNihii)) : "") +
      (hcpName ? "&hcpName=" + encodeURIComponent(String(hcpName)) : "")
    let headers = this.headers
    headers = headers
      .filter(h => h.header !== "Content-Type")
      .concat(new XHR.Header("Content-Type", "application/json"))
    xFHCTokenId && (headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId)))
    xFHCKeystoreId && (headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId)))
    xFHCPassPhrase && (headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase)))
    return XHR.sendCommand("POST", _url, headers, _body, this.fetchImpl)
      .then(doc => JSON.parse(JSON.stringify(doc.body)))
      .catch(err => this.handleError(err))
  }

  /**
   *
   * @summary confirmMemberDataMessagesAsync
   * @param body mdaMessagesReference
   * @param xFHCTokenId X-FHC-tokenId
   * @param xFHCKeystoreId X-FHC-keystoreId
   * @param xFHCPassPhrase X-FHC-passPhrase
   * @param hcpNihii hcpNihii
   * @param hcpName hcpName
   */
  confirmMemberDataMessagesAsyncUsingPOST(
    xFHCTokenId: string,
    xFHCKeystoreId: string,
    xFHCPassPhrase: string,
    hcpNihii: string,
    hcpName: string,
    body?: Array<string>
  ): Promise<boolean> {
    let _body = null
    _body = body

    const _url =
      this.host +
      `/mda/async/confirm/messages` +
      "?ts=" +
      new Date().getTime() +
      (hcpNihii ? "&hcpNihii=" + encodeURIComponent(String(hcpNihii)) : "") +
      (hcpName ? "&hcpName=" + encodeURIComponent(String(hcpName)) : "")
    let headers = this.headers
    headers = headers
      .filter(h => h.header !== "Content-Type")
      .concat(new XHR.Header("Content-Type", "application/json"))
    xFHCTokenId && (headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId)))
    xFHCKeystoreId && (headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId)))
    xFHCPassPhrase && (headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase)))
    return XHR.sendCommand("POST", _url, headers, _body, this.fetchImpl)
      .then(doc => JSON.parse(JSON.stringify(doc.body)))
      .catch(err => this.handleError(err))
  }

  /**
   *
   * @summary getMemberDataByMembership
   * @param io io
   * @param ioMembership ioMembership
   * @param xFHCTokenId X-FHC-tokenId
   * @param xFHCKeystoreId X-FHC-keystoreId
   * @param xFHCPassPhrase X-FHC-passPhrase
   * @param hcpNihii hcpNihii
   * @param hcpSsin hcpSsin
   * @param hcpName hcpName
   * @param hcpQuality hcpQuality
   * @param date date
   * @param endDate endDate
   * @param hospitalized hospitalized
   * @param requestType requestType
   */
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
    hospitalized?: boolean,
    requestType?: string
  ): Promise<MemberDataResponse> {
    let _body = null

    const _url =
      this.host +
      `/mda/${encodeURIComponent(String(io))}/${encodeURIComponent(String(ioMembership))}` +
      "?ts=" +
      new Date().getTime() +
      (hcpNihii ? "&hcpNihii=" + encodeURIComponent(String(hcpNihii)) : "") +
      (hcpSsin ? "&hcpSsin=" + encodeURIComponent(String(hcpSsin)) : "") +
      (hcpName ? "&hcpName=" + encodeURIComponent(String(hcpName)) : "") +
      (hcpQuality ? "&hcpQuality=" + encodeURIComponent(String(hcpQuality)) : "") +
      (date ? "&date=" + encodeURIComponent(String(date)) : "") +
      (endDate ? "&endDate=" + encodeURIComponent(String(endDate)) : "") +
      (hospitalized ? "&hospitalized=" + encodeURIComponent(String(hospitalized)) : "") +
      (requestType ? "&requestType=" + encodeURIComponent(String(requestType)) : "")
    let headers = this.headers
    xFHCTokenId && (headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId)))
    xFHCKeystoreId && (headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId)))
    xFHCPassPhrase && (headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase)))
    return XHR.sendCommand("GET", _url, headers, _body, this.fetchImpl)
      .then(doc => new MemberDataResponse(doc.body as JSON))
      .catch(err => this.handleError(err))
  }

  /**
   *
   * @summary getMemberDataMessageAsync
   * @param xFHCTokenId X-FHC-tokenId
   * @param xFHCKeystoreId X-FHC-keystoreId
   * @param xFHCPassPhrase X-FHC-passPhrase
   * @param hcpNihii hcpNihii
   * @param hcpName hcpName
   * @param messageNames messageNames
   */
  getMemberDataMessageAsyncUsingPOST(
    xFHCTokenId: string,
    xFHCKeystoreId: string,
    xFHCPassPhrase: string,
    hcpNihii: string,
    hcpName: string,
    messageNames: Array<string>
  ): Promise<MemberDataList> {
    let _body = null

    const _url =
      this.host +
      `/mda/async/messages` +
      "?ts=" +
      new Date().getTime() +
      (hcpNihii ? "&hcpNihii=" + encodeURIComponent(String(hcpNihii)) : "") +
      (hcpName ? "&hcpName=" + encodeURIComponent(String(hcpName)) : "") +
      (messageNames ? "&messageNames=" + encodeURIComponent(String(messageNames)) : "")
    let headers = this.headers
    xFHCTokenId && (headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId)))
    xFHCKeystoreId && (headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId)))
    xFHCPassPhrase && (headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase)))
    return XHR.sendCommand("POST", _url, headers, _body, this.fetchImpl)
      .then(doc => new MemberDataList(doc.body as JSON))
      .catch(err => this.handleError(err))
  }

  /**
   *
   * @summary getMemberData
   * @param ssin ssin
   * @param xFHCTokenId X-FHC-tokenId
   * @param xFHCKeystoreId X-FHC-keystoreId
   * @param xFHCPassPhrase X-FHC-passPhrase
   * @param hcpNihii hcpNihii
   * @param hcpSsin hcpSsin
   * @param hcpName hcpName
   * @param hcpQuality hcpQuality
   * @param date date
   * @param endDate endDate
   * @param hospitalized hospitalized
   * @param requestType requestType
   */
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
    hospitalized?: boolean,
    requestType?: string
  ): Promise<MemberDataResponse> {
    let _body = null

    const _url =
      this.host +
      `/mda/${encodeURIComponent(String(ssin))}` +
      "?ts=" +
      new Date().getTime() +
      (hcpNihii ? "&hcpNihii=" + encodeURIComponent(String(hcpNihii)) : "") +
      (hcpSsin ? "&hcpSsin=" + encodeURIComponent(String(hcpSsin)) : "") +
      (hcpName ? "&hcpName=" + encodeURIComponent(String(hcpName)) : "") +
      (hcpQuality ? "&hcpQuality=" + encodeURIComponent(String(hcpQuality)) : "") +
      (date ? "&date=" + encodeURIComponent(String(date)) : "") +
      (endDate ? "&endDate=" + encodeURIComponent(String(endDate)) : "") +
      (hospitalized ? "&hospitalized=" + encodeURIComponent(String(hospitalized)) : "") +
      (requestType ? "&requestType=" + encodeURIComponent(String(requestType)) : "")
    let headers = this.headers
    xFHCTokenId && (headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId)))
    xFHCKeystoreId && (headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId)))
    xFHCPassPhrase && (headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase)))
    return XHR.sendCommand("GET", _url, headers, _body, this.fetchImpl)
      .then(doc => new MemberDataResponse(doc.body as JSON))
      .catch(err => this.handleError(err))
  }

  /**
   *
   * @summary queryMemberDataByMembership
   * @param body facets
   * @param io io
   * @param ioMembership ioMembership
   * @param xFHCTokenId X-FHC-tokenId
   * @param xFHCKeystoreId X-FHC-keystoreId
   * @param xFHCPassPhrase X-FHC-passPhrase
   * @param hcpNihii hcpNihii
   * @param hcpSsin hcpSsin
   * @param hcpName hcpName
   * @param hcpQuality hcpQuality
   * @param date date
   * @param endDate endDate
   * @param hospitalized hospitalized
   * @param requestType requestType
   */
  queryMemberDataByMembershipUsingPOST(
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
    hospitalized?: boolean,
    requestType?: string,
    body?: Array<FacetDto>
  ): Promise<MemberDataResponse> {
    let _body = null
    _body = body

    const _url =
      this.host +
      `/mda/${encodeURIComponent(String(io))}/${encodeURIComponent(String(ioMembership))}` +
      "?ts=" +
      new Date().getTime() +
      (hcpNihii ? "&hcpNihii=" + encodeURIComponent(String(hcpNihii)) : "") +
      (hcpSsin ? "&hcpSsin=" + encodeURIComponent(String(hcpSsin)) : "") +
      (hcpName ? "&hcpName=" + encodeURIComponent(String(hcpName)) : "") +
      (hcpQuality ? "&hcpQuality=" + encodeURIComponent(String(hcpQuality)) : "") +
      (date ? "&date=" + encodeURIComponent(String(date)) : "") +
      (endDate ? "&endDate=" + encodeURIComponent(String(endDate)) : "") +
      (hospitalized ? "&hospitalized=" + encodeURIComponent(String(hospitalized)) : "") +
      (requestType ? "&requestType=" + encodeURIComponent(String(requestType)) : "")
    let headers = this.headers
    headers = headers
      .filter(h => h.header !== "Content-Type")
      .concat(new XHR.Header("Content-Type", "application/json"))
    xFHCTokenId && (headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId)))
    xFHCKeystoreId && (headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId)))
    xFHCPassPhrase && (headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase)))
    return XHR.sendCommand("POST", _url, headers, _body, this.fetchImpl)
      .then(doc => new MemberDataResponse(doc.body as JSON))
      .catch(err => this.handleError(err))
  }

  /**
   *
   * @summary queryMemberData
   * @param body facets
   * @param ssin ssin
   * @param xFHCTokenId X-FHC-tokenId
   * @param xFHCKeystoreId X-FHC-keystoreId
   * @param xFHCPassPhrase X-FHC-passPhrase
   * @param hcpNihii hcpNihii
   * @param hcpSsin hcpSsin
   * @param hcpName hcpName
   * @param hcpQuality hcpQuality
   * @param date date
   * @param endDate endDate
   * @param hospitalized hospitalized
   * @param requestType requestType
   */
  queryMemberDataUsingPOST(
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
    hospitalized?: boolean,
    requestType?: string,
    body?: Array<FacetDto>
  ): Promise<MemberDataResponse> {
    let _body = null
    _body = body

    const _url =
      this.host +
      `/mda/${encodeURIComponent(String(ssin))}` +
      "?ts=" +
      new Date().getTime() +
      (hcpNihii ? "&hcpNihii=" + encodeURIComponent(String(hcpNihii)) : "") +
      (hcpSsin ? "&hcpSsin=" + encodeURIComponent(String(hcpSsin)) : "") +
      (hcpName ? "&hcpName=" + encodeURIComponent(String(hcpName)) : "") +
      (hcpQuality ? "&hcpQuality=" + encodeURIComponent(String(hcpQuality)) : "") +
      (date ? "&date=" + encodeURIComponent(String(date)) : "") +
      (endDate ? "&endDate=" + encodeURIComponent(String(endDate)) : "") +
      (hospitalized ? "&hospitalized=" + encodeURIComponent(String(hospitalized)) : "") +
      (requestType ? "&requestType=" + encodeURIComponent(String(requestType)) : "")
    let headers = this.headers
    headers = headers
      .filter(h => h.header !== "Content-Type")
      .concat(new XHR.Header("Content-Type", "application/json"))
    xFHCTokenId && (headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId)))
    xFHCKeystoreId && (headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId)))
    xFHCPassPhrase && (headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase)))
    return XHR.sendCommand("POST", _url, headers, _body, this.fetchImpl)
      .then(doc => new MemberDataResponse(doc.body as JSON))
      .catch(err => this.handleError(err))
  }

  /**
   *
   * @summary sendMemberDataRequestAsync
   * @param body mdaRequest
   * @param xFHCTokenId X-FHC-tokenId
   * @param xFHCKeystoreId X-FHC-keystoreId
   * @param xFHCPassPhrase X-FHC-passPhrase
   * @param hcpNihii hcpNihii
   * @param hcpName hcpName
   * @param hcpQuality hcpQuality
   * @param date date
   * @param endDate endDate
   * @param hospitalized hospitalized
   * @param requestType requestType
   */
  sendMemberDataRequestAsyncUsingPOST(
    xFHCTokenId: string,
    xFHCKeystoreId: string,
    xFHCPassPhrase: string,
    hcpNihii: string,
    hcpName: string,
    hcpQuality?: string,
    date?: number,
    endDate?: number,
    hospitalized?: boolean,
    requestType?: string,
    body?: MemberDataBatchRequestDto
  ): Promise<GenAsyncResponse> {
    let _body = null
    _body = body

    const _url =
      this.host +
      `/mda/async/request` +
      "?ts=" +
      new Date().getTime() +
      (hcpNihii ? "&hcpNihii=" + encodeURIComponent(String(hcpNihii)) : "") +
      (hcpName ? "&hcpName=" + encodeURIComponent(String(hcpName)) : "") +
      (hcpQuality ? "&hcpQuality=" + encodeURIComponent(String(hcpQuality)) : "") +
      (date ? "&date=" + encodeURIComponent(String(date)) : "") +
      (endDate ? "&endDate=" + encodeURIComponent(String(endDate)) : "") +
      (hospitalized ? "&hospitalized=" + encodeURIComponent(String(hospitalized)) : "") +
      (requestType ? "&requestType=" + encodeURIComponent(String(requestType)) : "")
    let headers = this.headers
    headers = headers
      .filter(h => h.header !== "Content-Type")
      .concat(new XHR.Header("Content-Type", "application/json"))
    xFHCTokenId && (headers = headers.concat(new XHR.Header("X-FHC-tokenId", xFHCTokenId)))
    xFHCKeystoreId && (headers = headers.concat(new XHR.Header("X-FHC-keystoreId", xFHCKeystoreId)))
    xFHCPassPhrase && (headers = headers.concat(new XHR.Header("X-FHC-passPhrase", xFHCPassPhrase)))
    return XHR.sendCommand("POST", _url, headers, _body, this.fetchImpl)
      .then(doc => new GenAsyncResponse(doc.body as JSON))
      .catch(err => this.handleError(err))
  }
}
