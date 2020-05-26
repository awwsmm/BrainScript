import { expect } from 'chai'
import { bf } from '../src'
import { UInt32, UTF32Char } from 'utf32char'

// suspend program output during testing
console.log = function (_: any) { }

describe('bf, regardless of mode', () => {

  it ("throws an error when '[' is missing a matching ']'", () => {
    expect(() => bf("[", true)).to.throw()
    expect(() => bf("[", false)).to.throw()
  })

  it ("throws an error when ']' is missing a matching '['", () => {
    expect(() => bf("+]", true)).to.throw()
    expect(() => bf("+]", false)).to.throw()
  })

  it ("throws an error when the user gives a length-0 string as input", () => {
    const memory: UInt32 = UInt32.fromNumber(1)
    for (const mode of [ true, false ])
      for (const numin of [ true, false ])
        expect(() => bf(",", mode, numin, false,  memory, () => UTF32Char.fromString(""))).to.throw()
  })

  it ("throws an error when the user gives a length-3+ string as input", () => {
    const memory: UInt32 = UInt32.fromNumber(1)
    for (const mode of [ true, false ])
      for (const numin of [ true, false ])
        expect(() => bf(",", mode, numin, false, memory, () => UTF32Char.fromString("abc"))).to.throw()
  })

  it ("correctly interprets the addition example from Wikipedia", () => {
    expect(bf(test_wikiAddition, true)).to.equal("7")
    expect(bf(test_wikiAddition, false)).to.equal("7")
  })

  it ("correctly interprets the long 'Hello World!' example from Wikipedia", () => {
    expect(bf(test_wikiHelloWorldLong, true)).to.equal("Hello World!\n")
    expect(bf(test_wikiHelloWorldLong, false)).to.equal("Hello World!\n")
  })

  it ("correctly interprets the short 'Hello World!' example from Wikipedia", () => {
    expect(bf(test_wikiHelloWorldShort, true)).to.equal("Hello World!\n")
    expect(bf(test_wikiHelloWorldShort, false)).to.equal("Hello World!\n")
  })

  // https://codegolf.stackexchange.com/a/21857/79936
  it ("correctly interprets the two-part '42' example from StackExchange", () => {
    expect(bf(test_se42Part1, true)).to.equal(test_se42Part2)
    expect(bf(test_se42Part1, false)).to.equal(test_se42Part2)
    expect(bf(test_se42Part2, true)).to.equal("6*7=42")
    expect(bf(test_se42Part2, false)).to.equal("6*7=42")
  })

})

describe('bf in classic mode', () => {

  const classic: boolean = true

  it ("does not throw an error when attempting to access negative memory cells", () => {
    expect(() => bf("<", classic)).to.not.throw()
  })

  it ("does not throw an error when attempting to access too-high memory cells", () => {
    const memory: UInt32 = UInt32.fromNumber(1)
    expect(() => bf(">>", classic, false, false, memory)).to.not.throw()
  })

  it ("does not throw an error when attempting to set a cell to a negative value", () => {
    expect(() => bf("-", classic)).to.not.throw()
  })

  it ("does not throw an error when attempting to set a cell to a too-high value", () => {
    const memory: UInt32 = UInt32.fromNumber(1)
    expect(() => bf(",+", classic, false, false, memory, () => UTF32Char.fromNumber(UInt32.MAX_VALUE))).to.not.throw()
  })

  it ("correctly interprets the code-golfed 'Hello, World!' example from StackExchange", () => {
    expect(bf(test_seCodeGolfHelloWorld, classic)).to.equal("Hello, World!")
  })

})

describe('bf not in classic mode', () => {

  const classic: boolean = false

  it ("throws an error when attempting to access negative memory cells", () => {
    expect(() => bf("<", classic)).to.throw()
  })

  it ("throws an error when attempting to access too-high memory cells", () => {
    const memory: UInt32 = UInt32.fromNumber(1)
    expect(() => bf(">>", classic, false, false, memory)).to.throw()
  })

  it ("throws an error when attempting to set a cell to a negative value", () => {
    expect(() => bf("-", classic)).to.throw()
  })

  it ("throws an error when attempting to set a cell to a too-high value", () => {
    const memory: UInt32 = UInt32.fromNumber(1)
    expect(() => bf(",+", classic, false, false, memory, () => UTF32Char.fromNumber(UInt32.MAX_VALUE))).to.throw()
  })

  it ("throws an error with the code-golfed 'Hello, World!' example from StackExchange", () => {
    expect(() => bf(test_seCodeGolfHelloWorld, classic)).to.throw()
  })

})

const test_wikiAddition: string = `
++       Cell c0 = 2
> +++++  Cell c1 = 5

[        Start your loops with your cell pointer on the loop counter (c1 in our case)
< +      Add 1 to c0
> -      Subtract 1 from c1
]        End your loops with the cell pointer on the loop counter

At this point our program has added 5 to 2 leaving 7 in c0 and 0 in c1
but we cannot output this value to the terminal since it is not ASCII encoded!

To display the ASCII character "7" we must add 48 to the value 7
48 = 6 * 8 so let's use another loop to help us!

++++ ++++  c1 = 8 and this will be our loop counter again
[
< +++ +++  Add 6 to c0
> -        Subtract 1 from c1
]
< .        Print out c0 which has the value 55 which translates to "7"!
`

const test_wikiHelloWorldLong: string = `
[ This program prints "Hello World!" and a newline to the screen, its
  length is 106 active command characters. [It is not the shortest.]

  This loop is an "initial comment loop", a simple way of adding a comment
  to a BF program such that you don't have to worry about any command
  characters. Any ".", ",", "+", "-", "<" and ">" characters are simply
  ignored, the "[" and "]" characters just have to be balanced. This
  loop and the commands it contains are ignored because the current cell
  defaults to a value of 0; the 0 value causes this loop to be skipped.
]
++++++++               Set Cell #0 to 8
[
    >++++               Add 4 to Cell #1; this will always set Cell #1 to 4
    [                   as the cell will be cleared by the loop
        >++             Add 2 to Cell #2
        >+++            Add 3 to Cell #3
        >+++            Add 3 to Cell #4
        >+              Add 1 to Cell #5
        <<<<-           Decrement the loop counter in Cell #1
    ]                   Loop till Cell #1 is zero; number of iterations is 4
    >+                  Add 1 to Cell #2
    >+                  Add 1 to Cell #3
    >-                  Subtract 1 from Cell #4
    >>+                 Add 1 to Cell #6
    [<]                 Move back to the first zero cell you find; this will
                        be Cell #1 which was cleared by the previous loop
    <-                  Decrement the loop Counter in Cell #0
]                       Loop till Cell #0 is zero; number of iterations is 8

The result of this is:
Cell No :   0   1   2   3   4   5   6
Contents:   0   0  72 104  88  32   8
Pointer :   ^

>>.                     Cell #2 has value 72 which is 'H'
>---.                   Subtract 3 from Cell #3 to get 101 which is 'e'
+++++++..+++.           Likewise for 'llo' from Cell #3
>>.                     Cell #5 is 32 for the space
<-.                     Subtract 1 from Cell #4 for 87 to give a 'W'
<.                      Cell #3 was set to 'o' from the end of 'Hello'
+++.------.--------.    Cell #3 for 'rl' and 'd'
>>+.                    Add 1 to Cell #5 gives us an exclamation point
>++.                    And finally a newline from Cell #6
`

const test_wikiHelloWorldShort: string = `
++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.
`

const test_seCodeGolfHelloWorld: string = `
--<-<<+[+[<+>--->->->-<<<]>]<<--.<++++++.<<-..<<.<+.>>.>>.<<<.+++.>>.>>-.<<<+.
`

const test_se42Part1: string = `
           +++++[>++[>+>+        ++>++++>++++>++++>++++++
          >++++++>+++++++        ++>+++++++++<<<<<<<<<-]>>
         >+>+>+> >>>+[<]<        -]>>       >++>-->>+>>++>+
        >--<<<<  <<<.....         .>            ....<......
       ...>...   <<.>....                       >.>>>>>.<.
       <<<<..     ..<....                      >..>>>>>.<
      .<<<<.      >>>.<<.                     >>>>>.<.<
      <<<<<       <.>...>                    >>>.>>>.
     <<<.<        <<<..>>                  .>>>>>.<
    <.<<<         <<...>>                 >>>.<<<
   <..<.          ...>...               <<.>..>.
   >>.<.<<...>>...<<...>>...<         <....>>..
  .<<<.>.>>..>.<<.......<....        .....>...
                 <<.>...            .....>...
                 <......           .>>>.<<..
                 <<.>...          .....>...<......>.>>.<.<<<
                 .>......        ..>>...<<....>>.....>.<..>.
`

const test_se42Part2: string = 
`      ++++         +++
    +[>++++    ++[>+<-][
   <]<  -]>   >++    +++
  +.-   ---   ---    ---
 --.+++++++         +++
        +++       .++
        +++      +.-
        ---    -----.--.`