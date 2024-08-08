/*
 * Copyright 2009-2024 Roland Huss
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Jolokia, {
  BaseRequest,
  ExecRequest,
  ExecResponseValue,
  IJolokia,
  JolokiaErrorResponse,
  JolokiaSuccessResponse,
  ListRequest,
  ListResponseValue,
  ReadRequest,
  ReadResponseValue,
  RequestOptions,
  SearchRequest,
  SearchResponseValue,
  VersionRequest,
  VersionResponseValue,
  WriteRequest,
  WriteResponseValue
} from "jolokia.js"

import { IJolokiaSimple } from "./jolokia-simple-types.js"

// ++++++++++++++++++++++++++++++++++++++++++++++++++
// Public API defined in Jolokia.prototype. Most of the methods come from "jolokia.js", here we extend
// the interface (JS prototype) with "simple" methods which use jolokia.request() internally

Jolokia.prototype.getAttribute = async function (this: IJolokia, mbean: string, ...params: (string | string[] | RequestOptions)[]):
    Promise<ReadResponseValue> {

  const request: ReadRequest = { type: "read", mbean: mbean }
  let options: RequestOptions = {}

  if (params.length === 3 && typeof params[2] === "object") {
    // attribute: string | string[], path: string | string[], opts: AttributeRequestOptions
    request.attribute = params[0] as string | string[]
    addPath(request, params[1] as string | string[])
    options = params[2] as RequestOptions
  } else if (params.length === 2) {
    // attribute: string | string[], opts: AttributeRequestOptions
    // attribute: string | string[], path: string | string
    request.attribute = params[0] as string | string[]
    if (typeof params[1] === "object") {
      options = params[1] as RequestOptions
    } else {
      addPath(request, params[1] as string | string[])
    }
  } else if (params.length == 1) {
    // opts: AttributeRequestOptions
    // attribute: string | string[]
    if (typeof params[0] === "object") {
      options = params[0] as RequestOptions
    } else {
      request.attribute = params[0] as string | string[]
    }
  }

  options.method = "post"
  createValueCallback(options)

  return await this.request(request, options)
    .then((response): ReadResponseValue => {
      if (Array.isArray(response)) {
        // JolokiaSuccessResponse or JolokiaErrorResponse
        if (Jolokia.isError(response[0])) {
          throw (response[0] as JolokiaErrorResponse).error
        } else {
          return (response[0] as JolokiaSuccessResponse).value as ReadResponseValue
        }
      } else {
        return null
      }
    })
}

Jolokia.prototype.setAttribute = async function (this: IJolokia, mbean: string, attribute: string, value: unknown, ...params: (string | string[] | RequestOptions)[]):
    Promise<WriteResponseValue> {

  const request: WriteRequest = { type: "write", mbean, attribute, value }
  let options: RequestOptions = {}

  if (params.length === 2 && typeof params[1] === "object") {
    addPath(request, params[0] as string | string[])
    options = params[1] as RequestOptions
  } else if (params.length === 1) {
    if (typeof params[0] === "object") {
      options = params[0] as RequestOptions
    } else {
      addPath(request, params[0] as string | string[])
    }
  }

  options.method = "post"
  createValueCallback(options)

  return await this.request(request, options)
    .then((response): WriteResponseValue => {
      if (Array.isArray(response)) {
        // JolokiaSuccessResponse or JolokiaErrorResponse
        if (Jolokia.isError(response[0])) {
          throw (response[0] as JolokiaErrorResponse).error
        } else {
          return (response[0] as JolokiaSuccessResponse).value as WriteResponseValue
        }
      } else {
        return null
      }
    })
}

Jolokia.prototype.execute = async function (this: IJolokia, mbean: string, operation: string, /*opts?: RequestOptions, */...params: unknown[]):
    Promise<ExecResponseValue> {

  const parameters = params.length > 0 && params[params.length - 1] && typeof params[params.length - 1] === "object"
    ? params.slice(0, -1) : params
  const request: ExecRequest = { type: "exec", mbean, operation, arguments: parameters }
  const options: RequestOptions = params.length > 0 && params[params.length - 1] && typeof params[params.length - 1] === "object"
    ? params[params.length - 1] as RequestOptions : {}

  options.method = "post"
  createValueCallback(options)

  return await this.request(request, options)
    .then((response): ExecResponseValue => {
      if (Array.isArray(response)) {
        // JolokiaSuccessResponse or JolokiaErrorResponse
        if (Jolokia.isError(response[0])) {
          throw (response[0] as JolokiaErrorResponse).error
        } else {
          return (response[0] as JolokiaSuccessResponse).value as ExecResponseValue
        }
      } else {
        return null
      }
    })
}

Jolokia.prototype.search = async function (this: IJolokia, mbeanPattern: string, opts?: RequestOptions):
    Promise<SearchResponseValue> {

  const request: SearchRequest = { type: "search", mbean: mbeanPattern }
  const options: RequestOptions = opts ? opts : {}

  options.method = "post"
  createValueCallback(options)

  return await this.request(request, options)
    .then((response): SearchResponseValue => {
      if (Array.isArray(response)) {
        // JolokiaSuccessResponse or JolokiaErrorResponse
        if (Jolokia.isError(response[0])) {
          throw (response[0] as JolokiaErrorResponse).error
        } else {
          return !(response[0] as JolokiaSuccessResponse).value ? [] : (response[0] as JolokiaSuccessResponse).value as SearchResponseValue
        }
      } else {
        return []
      }
    })
}

Jolokia.prototype.version = async function (this: IJolokia, opts?: RequestOptions):
    Promise<VersionResponseValue | null> {

  const request: VersionRequest = { type: "version" }
  const options: RequestOptions = opts ? opts : {}

  options.method = "post"
  createValueCallback(options)

  return await this.request(request, options)
    .then((response): VersionResponseValue | null => {
      if (Array.isArray(response)) {
        // JolokiaSuccessResponse or JolokiaErrorResponse
        if (Jolokia.isError(response[0])) {
          throw (response[0] as JolokiaErrorResponse).error
        } else {
          return (response[0] as JolokiaSuccessResponse).value as VersionResponseValue
        }
      } else {
        return null
      }
    })
}

Jolokia.prototype.list = async function(this: IJolokia, ...params: (string[] | string | RequestOptions)[]):
    Promise<ListResponseValue> {

  const request: ListRequest = { type: "list" }
  let options: RequestOptions = {}

  if (params.length === 2 && typeof params[1] === "object") {
    addPath(request, params[0] as string | string[])
    options = params[1] as RequestOptions
  } else if (params.length === 1) {
    if (!Array.isArray(params[0]) && typeof params[0] === "object") {
      options = params[0] as RequestOptions
    } else {
      addPath(request, params[0] as string | string[])
    }
  }

  options.method = "post"
  createValueCallback(options)

  return await this.request(request, options)
    .then((response): ListResponseValue => {
      if (Array.isArray(response)) {
        // JolokiaSuccessResponse or JolokiaErrorResponse
        if (Jolokia.isError(response[0])) {
          throw (response[0] as JolokiaErrorResponse).error
        } else {
          return (response[0] as JolokiaSuccessResponse).value as ListResponseValue
        }
      } else {
        return {}
      }
    })
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++
// Private/internal functions

/**
 * If path is an array, the elements get escaped. If not, it is taken directly
 * @param request
 * @param path
 */
function addPath(request: BaseRequest & Pick<ReadRequest, "path">, path: string | string[]) {
  if (path) {
    if (Array.isArray(path)) {
      request.path = path.map(Jolokia.escapePost).join("/")
    } else {
      request.path = path
    }
  }
}

/**
 * For Jolokia simple, passed callbacks don't expect full response (array), but only its `value` field.
 * @param options
 */
function createValueCallback(options: RequestOptions): void {
  if (options.success && typeof options.success === "function") {
    const passedSuccessCb = options.success as (value: unknown, index: number) => void
    options.success = (response: JolokiaSuccessResponse, index: number) => {
      passedSuccessCb(response.value, index)
    }
  }
}

export * from "./jolokia-simple-types.js"
export default Jolokia as IJolokiaSimple
