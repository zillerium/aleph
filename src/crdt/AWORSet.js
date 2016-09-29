// @flow

const { Record, Set: ISet, is: isEqual } = require('immutable')
const { DotContext } = require('./DotContext')
const { DotKernel, DotKernelDelta } = require('./DotKernel')
import type { ReplicaID } from './types'

/**
 * An add-wins observed-remove set
 */
class AWORSet<V> extends Record({
  id: '',
  kernel: new DotKernel()
}) {
  constructor (id: ReplicaID, context?: DotContext) {
    if (context == null) {
      context = new DotContext()
    }
    const kernel = new DotKernel({context})

    super({id, kernel})
  }

  get id (): ReplicaID { return this.get('id') }
  get kernel (): DotKernel<V> { return this.get('kernel') }
  get context (): DotContext { return this.kernel.context }

  read (): ISet<V> {
    return new ISet(this.kernel.dataStore.values())
  }

  contains (val: V): boolean {
    for (const v of this.kernel.dataStore.values()) {
      if (isEqual(v, val)) {
        return true
      }
    }
    return false
  }

  add (val: V): AWORSet<V> {
    return this.join(this.addDelta(val))
  }

  addDelta (val: V): AWORSetDelta<V> {
    const kernelDelta = this.kernel.addDelta(this.id, val)
    return new AWORSetDelta({kernel: kernelDelta})
  }

  remove (val: V): AWORSet<V> {
    return this.join(this.removeDelta(val))
  }

  removeDelta (val: V): AWORSetDelta<V> {
    const kernelDelta = this.kernel.removeValueDelta(val)
    return new AWORSetDelta({kernel: kernelDelta})
  }

  join (other: AWORSet<V> | AWORSetDelta<V>): AWORSet<V> {
    return new AWORSet(this.id)
      .set('kernel', this.kernel.join(other.kernel))
  }
}

class AWORSetDelta<V> extends Record({
  kernel: new DotKernelDelta()
}) {
  get kernel (): DotKernelDelta<V> { return this.get('kernel') }
}

module.exports = {
  AWORSet,
  AWORSetDelta
}
