import { UTF32Char, UInt32 } from 'utf32char'
import { isToken } from './Token'

const readline = require('readline')
const readlineSync = require('readline-sync')

export function readUTF32Char(): UTF32Char {
  let input: string = ""
  while (true) {
    try {
      input = readlineSync.question("    ❓: ")
      const char: UTF32Char = UTF32Char.fromString(input)
      console.log("")
      return char
    } catch (error) {
      console.log(error.message)
      console.log(`Not a valid UTF-32 character: "${input}"`)
      console.log("  Please try again, or press CTRL-C to quit")
    }
  }
}

export function bf (
  program: string,
  classic: boolean = false,
  numin: boolean = false,
  numout: boolean = false,
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
          
  function isDigit (num: number): boolean { return num < 58 && num > 47 }
  function toDigit (num: number): number { return num - 48 }

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
        if (numout) {
          let given: number = value.toNumber()

          if (isDigit(given)) given = toDigit(given)
          else {
            let hiDigit: number = Math.floor(given / 10)
            let loDigit: number = given - 10*hiDigit
            if (isDigit(hiDigit) && isDigit(loDigit))
              given = toDigit(hiDigit) * 10 + toDigit(loDigit)
          }

          output += given.toString()

        } else output += UTF32Char.fromUInt32(value).toString()

      // input -- get one character from the user
      } else if (nextChar === ',') {
        if (numin) {
          console.log("\n    Please provide a 1 or 2-digit number for ',' input:")
          let given: number = input().toNumber()

          if (isDigit(given)) given = toDigit(given)
          else {
            let hiDigit: number = given >> 16
            let loDigit: number = given & 0x0000FFFF
            if (isDigit(hiDigit) && isDigit(loDigit))
              given = toDigit(hiDigit) * 10 + toDigit(loDigit)
            else throw new Error("non-digit characters entered in numeric mode")
          }

          state[index] = UInt32.fromNumber(given)

        } else {
          console.log("\n    Please provide a single character for ',' input:")
          state[index] = input().toUInt32()
        }
      }
    }

    programPointer = programPointer.plus(1)
  }

  return output
}

export function brain (): void {

  let mode:   boolean = false // default interpretation mode (vs. 'classic')
  let numin:  boolean = false // character input by default
  let numout: boolean = false // character output by default

  const signoffs: Array<string> = [
    "Totsiens",      "Ma'a as-salaama", "Bidāẏa",      "Zdravo",          "Joigin",
    "Donadagohvi",   "Doviđenja",       "Sbohem",      "Farvel",          "Tot ziens",
    "Nägemist",      "Näkemiin",        "Au Revoir",   "Auf Wiedersehen", "Yasou",
    "Aloha",         "L'hitraot",       "Namaste",     "Viszlát",         "Vertu sæll",
    "Sampai Jumpa",  "Slán",            "Arrivederci", "Sayōnara",        "안녕",
    "Vale",          "Uz redzēšanos",   "Atsiprasau",  "Zài jiàn",        "Ha det bra",
    "Khodaa haafez", "Żegnaj",          "Adeus",       "Alweda",          "La revedere",
    "Прощай",        "Dovidenia",       "Nasvidenje",  "Adios",           "Adjö",
    "Poitu varein",  "Laa Gòn",         "Görüşürüz",   "Do pobachennia",  "Khuda hafiz",
    "Tạm biệt",      "Hwyl fawr",       "Hamba kahle", "再见",             "وداعا",
    "May the force be with you",        "ลาก่อน",       "பிரியாவிடை",       "Namárië",
    "Qapla'",
    "Live long and prosper"
  ]

  const signoff = "👋 " + signoffs[Math.floor(Math.random() * signoffs.length)];

  let multiLine: string = ""
  let pasteMode: boolean = false
  let previousLine: string = ""

  function interpret (program: string, mode: boolean, numin: boolean, numout: boolean): void {
    const memory: UInt32 = UInt32.fromNumber(1000)
    try {
      console.log(bf(program, mode, numin, numout, memory))
    } catch (error) {
      console.log(error.message)
    }
  }

  console.log("\nEnter single-line BF code below or")
  console.log("  type :paste to paste multiline code")
  console.log("  type :mode to toggle classic / default mode")
  console.log("  type :numin to toggle numeric input mode")
  console.log("  type :numout to toggle numeric output mode")
  console.log("  type :quit or enter <CTRL>-C to quit")

  const defaultPrompt: string = "\n🧠: "
  readlineSync.setDefaultOptions({prompt: defaultPrompt})
  readlineSync.promptLoop(function(line: string) {
    
    // continue in :paste mode
    if (pasteMode) {

      // exit :paste mode
      if (previousLine === "" && previousLine === line) {
        console.log("~~~~~~~~~~~~~ INTERPRETING... ~~~~~~~~~~~~~\n")
        interpret(multiLine, mode, numin, numout)
        multiLine = ""
        pasteMode = false
        readlineSync.setDefaultOptions({prompt: defaultPrompt})
        return false

      // continue in :paste mode
      } else {
        previousLine = line
        multiLine += line
      }

    // enter :paste mode
    } else if (line === ":paste" && multiLine === "" && !pasteMode) {
      console.log("\nEntering multiline input mode.")
      console.log("Enter two blank lines in a row to interpret.")
      console.log("~~~~~~~~~~~~~~~ BEGIN INPUT ~~~~~~~~~~~~~~~\n\n")
      readlineSync.setDefaultOptions({prompt: ""})
      pasteMode = true

    // toggle classic / default interpretation mode
    } else if (line === ":mode") {
      mode = !mode
      let modeStr: string
      if (mode) modeStr = "classic"; else modeStr = "default"
      console.log(`\nChanged interpretation mode to '${modeStr}'`)
      return false

    // toggle numeric / character input mode
    } else if (line === ":numin") {
      numin = !numin
      let numinStr: string
      if (numin) numinStr = "numeric"; else numinStr = "character"
      console.log(`\nChanged input mode to '${numinStr}'`)
      return false

    // toggle numeric / character output mode
    } else if (line === ":numout") {
      numout = !numout
      let numoutStr: string
      if (numout) numoutStr = "numeric"; else numoutStr = "character"
      console.log(`\nChanged output mode to '${numoutStr}'`)
      return false

    } else if (line === ":quit") {
      return true

    // interpret single line
    } else {
      if (line.length > 0) interpret(line, mode, numin, numout)
      return false
    }
  })

  console.log(`${signoff}\n`)
}