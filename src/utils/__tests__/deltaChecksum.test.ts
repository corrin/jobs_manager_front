import { beforeAll, describe, expect, it } from 'vitest'

import {
  canonicaliseValue,
  serialiseForChecksum,
  computeJobDeltaChecksum,
  deltaChecksumUtils,
} from '../deltaChecksum'

beforeAll(async () => {
  if (!globalThis.crypto?.subtle) {
    const { webcrypto } = await import('node:crypto')
    // @ts-expect-error - assign webcrypto for test environment
    globalThis.crypto = webcrypto as Crypto
  }
})

describe('canonicaliseValue', () => {
  it('normalises primitive types', () => {
    expect(canonicaliseValue(null)).toEqual(deltaChecksumUtils.NULL_SENTINEL)
    expect(canonicaliseValue(undefined)).toEqual(deltaChecksumUtils.NULL_SENTINEL)
    expect(canonicaliseValue('  hello  ')).toEqual('hello')
    expect(canonicaliseValue('2024-01-01')).toEqual('2024-01-01T00:00:00.000Z')
    expect(canonicaliseValue(true)).toEqual('true')
    expect(canonicaliseValue(5)).toEqual('5')
    expect(canonicaliseValue(5.1)).toEqual('5.1')
  })

  it('normalises arrays and objects deterministically', () => {
    expect(canonicaliseValue([' A ', 'b'])).toEqual('[A,b]')
    expect(canonicaliseValue({ b: ' two', a: ' one ' })).toEqual('{a=one|b=two}')
  })
})

describe('serialiseForChecksum & compute', () => {
  it('serialises fields deterministically', async () => {
    const before = {
      description: '  Cut and fold  ',
      order_number: 'PO-123',
      quoted: true,
      charge_out_rate: 5.1,
    }
    const serialised = serialiseForChecksum('job-123', before, ['quoted', 'description'])
    expect(serialised).toEqual('job-123|description=Cut and fold|quoted=true')
    const checksum = await computeJobDeltaChecksum('job-123', before, ['quoted', 'description'])
    expect(checksum).toMatch(/^[a-f0-9]{64}$/)
    const checksumRepeat = await computeJobDeltaChecksum('job-123', before, [
      'description',
      'quoted',
    ])
    expect(checksumRepeat).toEqual(checksum)
  })
})
