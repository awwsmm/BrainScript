import { UTF32Char, UInt32 } from 'utf32char'
import { isToken } from './Token'

const readline = require('readline')
const readlineSync = require('readline-sync')

export function readUTF32Char(): UTF32Char {
  let input: string = ""
  while (true) {
    try {
      input = readlineSync.question("> ")
      return UTF32Char.fromString(input)
    } catch (error) {
      console.log(error.message)
      console.log(`Not a valid UTF-32 character: "${input}"`)
      console.log("  Please try again, or press CTRL-C to quit")
    }
  }
}

export function bf ( program: string,
  classic: boolean,
  memory: UInt32 = UInt32.fromNumber(1000),
  input: () => UTF32Char = readUTF32Char
    ): string {

  // validate memory
  if (memory.lt(1)) throw new Error("must provide at least 1 cell of memory")
  
  // program state setup
  let state = new Array<UInt32>(memory.toNumber()).fill(UInt32.fromNumber(0))
  let memoryPointer: UInt32 = new UInt32(0)
  let programPointer: UInt32 = new UInt32(0)
  let output: string = ""
  
  // move the memory pointer left or right
  function movePointer (op: string): void {

    // move back one cell in memory
    if (op === '<') {
      if (classic) {
        if (memoryPointer.lt(1)) memoryPointer = memory.minus(1)
        else memoryPointer = memoryPointer.minus(1)
      } else {
        try {
          memoryPointer = memoryPointer.minus(1)
       } catch (error) {
         throw new Error("cannot decrement memory pointer below minimum index 0... try setting `classic` to `true`")
       }
      }

    // move forward one cell in memory
    } else if (op === '>') {
      if (classic) {
        if (memoryPointer.ge(memory.minus(1))) memoryPointer = UInt32.fromNumber(0)
        else memoryPointer = memoryPointer.plus(1)
      } else {
        if (memoryPointer.ge(memory.minus(1)))
          throw new Error(`cannot increment memory pointer above maximum index ${memory.minus(1).toString()}... try setting \`classic\` to \`true\``)
        else memoryPointer = memoryPointer.plus(1)
      }

    // if not '<' or '>', invalid argument
    } else throw new Error(`movePointer received invalid op: ${op}`)
  }
  
  // changes the value of the memory cell at the pointer
  function changeCell (op: string): void {
    if (!isToken(op)) throw new Error(`changeCell received invalid op: ${op}`)

    const index: number = memoryPointer.toNumber()
    const value: UInt32 = state[index]

    if (op === '+') {
      if (classic) {
        if (value.ge(255)) state[index] = UInt32.fromNumber(0)
        else state[index] = value.plus(1)
      } else {
        if (value.ge(UInt32.MAX_VALUE))
          throw new Error(`cell ${index} is already at maximum allowable value, 2^32 - 1... try setting \`classic\` to \`true\``)
        else state[index] = value.plus(1)
      }
    } else if (op === '-') {
      if (classic) {
        if (value.lt(1)) state[index] = UInt32.fromNumber(255)
        else state[index] = value.minus(1)
      } else {
        if (value.le(UInt32.MIN_VALUE))
          throw new Error(`cell ${index} is already at minimum allowable value, 0... try setting \`classic\` to \`true\``)
        else state[index] = value.minus(1)
      }
    } else {
      throw new Error(`changeCell received invalid op: ${op}`)
    }
  }

  // tries to run a side-effecting function and propagates Errors with helpful messages
  function mayFail (op: () => void): void {
    try { op() } catch(err) {

      const padWith:   string = "              "
      const padding:   number = padWith.length
      const ptr:       number = programPointer.toNumber()
      const minChIncl: number = Math.max(0, ptr - padding)
      const maxChExcl: number = Math.min(ptr + padding, program.length)
      const padLeft:   string = padWith.slice(ptr - padding)

      const errString: string = "\n" +
        padLeft + program.slice(minChIncl, maxChExcl) + '\n' +
        `Error at      ^      char index ${ptr}` + '\n' +
        `  message: ${err.message}` + '\n' +
        `   output: ${output}` + '\n'

      throw new Error(errString)
    }
  }

  // tries to move the programPointer to the character after the matching
  //   '[' if this is a ']' and vice versa
  function jump (op: string): void {
    if (!isToken(op)) throw new Error(`moveToMatch received invalid op: ${op}`)

    let delta: number = 1
    let index: number = 1

    if (op === '[') {
      const chars = program.slice(programPointer.toNumber() + 1).split("")

      for (const char of chars) {
             if (char === ']') delta -= 1
        else if (char === '[') delta += 1
        if (delta > 0) index += 1
        else break
      }

      if (delta > 0)
        throw new Error("missing close-brace ] for this open-brace [")
      else programPointer = programPointer.plus(index)

    } else if (op === ']') {
      const chars = program.slice(0, programPointer.toNumber()).split("").reverse()

      for (const char of chars) {
             if (char === '[') delta -= 1
        else if (char === ']') delta += 1
        if (delta > 0) index += 1
        else break
      }

      if (delta > 0)
        throw new Error("missing open-brace [ for this close-brace ]")
      else programPointer = programPointer.minus(index)
      
    } else {
      throw new Error(`moveToMatch received invalid op: ${op}`)
    }
  }

  // simply interpret token unless we see a '[' or a ']'
  while (programPointer.toNumber() < program.length) {
    let nextChar = program[programPointer.toNumber()]

    // ignore non-token characters
    if (isToken(nextChar)) {

      const index: number = memoryPointer.toNumber()
      const value: UInt32 = state[index]

      // begin while loop
      if (nextChar === '[' && value.lt(1)) {
        mayFail(() => jump(nextChar))

      // end while loop
      } else if (nextChar === ']' && value.gt(0)) {
        mayFail(() => jump(nextChar))

      // operations which move the pointer
      } else if (nextChar === '<' || nextChar === '>') {
        mayFail(() => movePointer(nextChar))

      // operations which change the values in cells
      } else if (nextChar === '+' || nextChar === '-') {
        mayFail(() => changeCell(nextChar))

      // output -- add to output buffer
      } else if (nextChar === '.') {
        output += UTF32Char.fromUInt32(value).toString()

      // input -- get one character from the user
      } else if (nextChar === ',') {
        state[index] = input().toUInt32()
      }
    }

    programPointer = programPointer.plus(1)
  }

  return output
}

export function brain (classic: boolean): void {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "  "
  })

  console.log("\nEnter or paste your BF code below")
  console.log("  and type CTRL+D on a blank line to interpret.")
  console.log("    (CTRL-C to quit.)\n")
  console.log("~~~ INPUT ~~~~~~~~~~~~🧠🤬~~~~~~~~~~~~~~~~~~~~~~\n")

  let program: string = ""

  rl.prompt()

  rl.on('line', (line: string) => {
    program += line
    rl.prompt()
  }).on('close', () => {
    console.log("\n~~~ OUTPUT ~~~~~~~~~~~🧠🤔~~~~~~~~~~~~~~~~~~~~~~\n")
    try {
      console.log(bf(program, classic))
      console.log("\n~~~ DONE! ~~~~~~~~~~~~🧠😎~~~~~~~~~~~~~~~~~~~~~~\n")
      process.exit(0)
    } catch (error) {
      console.log(" !!! Program encountered an error:")
      console.log(error.message)
      console.log("\n~~~ Oops! ~~~~~~~~~~~~🧠🐛~~~~~~~~~~~~~~~~~~~~~~\n")
      process.exit(1)
    }
  })

}