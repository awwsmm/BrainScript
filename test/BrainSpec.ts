import { expect } from 'chai'
import { bf } from '../src'
import { UInt32, UTF32Char } from 'utf32char'

describe('bf', () => {

  it ("throws an error when attempting to access negative memory cells", () => {
    expect(() => bf("<")).to.throw()
  })

  it ("throws an error when attempting to access too-high memory cells", () => {
    const memory: UInt32 = UInt32.fromNumber(1)
    expect(() => bf(">>", memory)).to.throw()
  })

  it ("throws an error when attempting to set a cell to a negative value", () => {
    expect(() => bf("-")).to.throw()
  })

  it ("throws an error when attempting to set a cell to a too-high value", () => {
    const memory: UInt32 = UInt32.fromNumber(1)
    expect(() => bf(",+", memory, () => UTF32Char.fromNumber(UInt32.MAX_VALUE))).to.throw()
  })

  it ("throws an error when '[' is missing a matching ']'", () => {
    expect(() => bf("[")).to.throw()
  })

  it ("throws an error when ']' is missing a matching '['", () => {
    expect(() => bf("+]")).to.throw()
  })

  it ("throws an error when the user gives a length-0 string as input", () => {
    const memory: UInt32 = UInt32.fromNumber(1)
    expect(() => bf(",", memory, () => UTF32Char.fromString(""))).to.throw()
  })

  it ("throws an error when the user gives a length-3+ string as input", () => {
    const memory: UInt32 = UInt32.fromNumber(1)
    expect(() => bf(",", memory, () => UTF32Char.fromString("abc"))).to.throw()
  })

})