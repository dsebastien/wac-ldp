import Debug from 'debug'
import rdf from 'rdf-ext'
import N3Parser from 'rdf-parser-n3'
import JsonLdParser from 'rdf-parser-jsonld'
import convert from 'buffer-to-stream'

import { Path, BlobTree, urlToPath } from '../storage/BlobTree'
import { Blob } from '../storage/Blob'
import { ResourceData, makeResourceData, streamToObject, determineRdfType, RdfType } from '../rdf/ResourceDataUtils'

const debug = Debug('getGraph')

export function getEmptyGraph () {
  return rdf.dataset()
}

function readRdf (rdfType: RdfType | undefined, bodyStream: ReadableStream) {
  let parser
  switch (rdfType) {
    case RdfType.JsonLd:
      debug('RdfType JSON-LD')
      parser = new JsonLdParser({
        factory: rdf
      })
      break
    case RdfType.Turtle:
    default:
      debug('RdfType N3')
      parser = new N3Parser({
        factory: rdf
      })
      break
  }
  return parser.import(bodyStream)
}

export async function getGraphLocal (blob: Blob): Promise<any> {
  const stream = await blob.getData()
  debug('stream', typeof stream)
  let resourceData
  if (stream) {
    resourceData = await streamToObject(stream) as ResourceData
  } else {
    return getEmptyGraph()
  }
  debug('got ACL ResourceData', resourceData)

  const bodyStream = convert(Buffer.from(resourceData.body))

  const quadStream = readRdf(resourceData.rdfType, bodyStream)
  return rdf.dataset().import(quadStream)
}

export async function getGraph (url: URL, serverHost: string, storage: BlobTree) {
  if (url.host === serverHost) {
    const path: Path = urlToPath(url)
    const blob: Blob = storage.getBlob(path)
    return getGraphLocal(blob)
  } else {
    const response: Response = await fetch(url.toString())
    const rdfType = determineRdfType(response.headers.get('content-type'))
    const quadStream = readRdf(rdfType, response as unknown as ReadableStream)
  }
}
