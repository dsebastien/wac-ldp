import uuid from 'uuid/v4'
import { BlobTree, Path } from '../storage/BlobTree'

import { WacLdpTask, TaskType } from '../api/http/HttpParser'
import { WacLdpResponse, ErrorResult, ResultType } from '../api/http/HttpResponder'
import { checkAccess, AccessCheckTask } from './checkAccess'
import { getBlobAndCheckETag } from './getBlobAndCheckETag'
import { determineOperation } from './determineOperation'

import Debug from 'debug'
const debug = Debug('executeTask')

export async function executeTask (wacLdpTask: WacLdpTask, aud: string, storage: BlobTree): Promise<WacLdpResponse> {
  // convert ContainerMemberAdd tasks to WriteBlob tasks on the new child
  if (wacLdpTask.wacLdpTaskType === TaskType.containerMemberAdd) {
    debug('converting', wacLdpTask)
    wacLdpTask.path = wacLdpTask.path.toChild(uuid())
    wacLdpTask.wacLdpTaskType = TaskType.blobWrite
    wacLdpTask.isContainer = false
    debug('converted', wacLdpTask)
  }
  await checkAccess({
    path: wacLdpTask.path,
    isContainer: wacLdpTask.isContainer,
    bearerToken: wacLdpTask.bearerToken,
    aud,
    origin: wacLdpTask.origin,
    wacLdpTaskType: wacLdpTask.wacLdpTaskType,
    storage
  } as AccessCheckTask) // may throw if access is denied

  let node: any
  if (wacLdpTask.isContainer) {
    node = storage.getContainer(wacLdpTask.path)
  } else {
    debug('not a container, getting blob and checking etag')
    node = await getBlobAndCheckETag(wacLdpTask, storage)
  }

  const operation = determineOperation(wacLdpTask.wacLdpTaskType)
  const response = await operation.apply(null, [wacLdpTask, node])
  debug('executed', response)
  return response
}
