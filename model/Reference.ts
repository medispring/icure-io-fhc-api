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
import { DigestMethod } from "./DigestMethod"
import { Transforms } from "./Transforms"

export class Reference {
  constructor(json: JSON | any) {
    Object.assign(this as Reference, json)
  }

  digestMethod?: DigestMethod
  digestValue?: ArrayBuffer
  id?: string
  transforms?: Transforms
  type?: string
  uri?: string
}
