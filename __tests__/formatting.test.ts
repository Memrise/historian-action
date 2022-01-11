import {expect, test} from '@jest/globals'
import rewire from 'rewire'

const formatting = rewire('../lib/formatting')

test('firstLine only returns the first line', () => {
  const firstLine = formatting.__get__('firstLine')

  expect(firstLine('one\ntwo\nthree')).toEqual('one')
})

test('getShortRef only shortens what we expect', () => {
  const getShortRef = formatting.__get__('getShortRef')

  expect(getShortRef('abc123')).toEqual('abc123')
  expect(getShortRef('0123456789abcdefABCDEF0123456789abcdefAB')).toEqual('0123456789')
  expect(getShortRef('1.2.3-post-version-identifier')).toEqual('1.2.3-post-version-identifier')
})
