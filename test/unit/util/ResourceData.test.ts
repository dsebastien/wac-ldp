
import { streamToObject, objectToStream, ResourceData, makeResourceData } from '../../../src/lib/util/ResourceDataUtils'

test('toStream -> fromStream', async () => {
  const obj = { foo: 'bar' }
  const stream = objectToStream(obj)
  const readBack = await streamToObject(stream)
  expect(readBack).toEqual(obj)
})

test('makeResourceData', async () => {
  const resourceData: ResourceData = makeResourceData('foo', 'bar')
  expect(resourceData).toEqual({
    contentType: 'foo',
    body: 'bar',
    etag: 'N7UdGUp1E+RbVvZSTy1R8g=='
  })
})
