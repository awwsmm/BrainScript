# BrainScript

A [BrainF***](https://en.wikipedia.org/wiki/Brainfuck) (BF) interpreter and REPL, written in TypeScript.

## Installation

Install from [npm](https://www.npmjs.com/package/brainscript) with

`$ npm i brainscript`

Or try it online at [npm.runkit.com](https://npm.runkit.com/brainscript)

```ts
var lib = require("brainscript")

lib.bf("++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.")
```

## Use

BrainScript provides a BF interpreter `bf` which can be used in interactive or batch mode, as well as a BF REPL `brain`.

`bf` can be used to batch process BF code, returning any resulting output as a `string`

```ts
const output: string = bf("++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.")

console.log(output) // Hello World!\n
```

...but it also provides basic interactive capabilities for programs which require user input

```ts
// input.ts
console.log(bf(",."))
```

```ts
$ npx ts-node input.ts

    Please provide a single character for ',' input:
    ❓: !

!
```

`brain` is an interactive REPL which accepts single- or multi-line programs as input:

```ts
// brain.ts
// ... imports, etc. ...
brain()
```

```ts
$ npx ts-node brain.ts

Enter single-line BF code below or
  type :paste to paste multiline code
  type :classic to toggle classic / default mode
  type :numin to toggle numeric input mode
  type :numout to toggle numeric output mode
  type :quit or enter <CTRL>-C to quit

🧠: ++++++>+++++++[-<[->>+>+<<<]>>[-<<+>>]<]>>.
*

🧠: :paste

Entering multiline input mode.
Enter two blank lines in a row to interpret.
~~~~~~~~~~~~~~~ BEGIN INPUT ~~~~~~~~~~~~~~~


       ++++         +++
    +[>++++    ++[>+<-][
   <]<  -]>   >++    +++
  +.-   ---   ---    ---
 --.+++++++         +++
        +++       .++
        +++      +.-
        ---    -----.--.


~~~~~~~~~~~~~ INTERPRETING... ~~~~~~~~~~~~~

6*7=42

🧠: 
```

## Customisation

### Custom Input Streams

When input is required by the BF program, `bf` will prompt the user for single-character input (using the [`UTF32Char` encoding](https://www.npmjs.com/package/utf32char)):

```ts
// example.ts
// ... imports, etc. ...
const io: string = bf(",.")
console.log(io)
```

```ts
$ npx ts-node example.ts

    Please provide a single character for ',' input:
    ❓: 😃

😃
```

`bf` defaults to interactively querying `stdin`, but this can be customised by the user:

```ts
// customInput.ts
// ... imports, etc. ...
function input(): UTF32Char { return UTF32Char.fromString("hi") }
const memory: UInt32 = UInt32.fromNumber(1)

const custom: string = bf(",.", false, false, false, memory, input)
console.log(custom)
```

```ts
$ npx ts-node customInput.ts

    Please provide a single character for ',' input:
hi
```

### Flags

`bf` provides a few boolean flags which affect how it interprets BF programs. These include:

- `numin` - when `true`, treats all input as numeric, rather than as characters
- `numout` - when `true`, outputs raw numeric data, rather than trying to convert them to characters
- `classic` - sets maximum cell values to `255`; allows "wraparound" in both the cell values and the memory tape

Using `bf`, these flags can be set in the function call (they are all `false` by default), but when running the interactive REPL `brain`, they must be toggled using the special REPL commands `:numin`, `:numout`, and `:classic`, respectively.

`numin` and `numout`, in particular, can make BF programs much easier to write and use.

By default (when `numin` is `false`), BF interprets all input as characters. So `63` is not the number `63`, but the character `6` (ASCII #54) followed by the character `3` (ASCII #51), which is interpreted as a 4-byte Unicode character with the higher bytes as `54` and lower bytes as `51`. (An [undefined character](https://unicode-table.com/en/search/?q=360033).)

And the number `42`, when written to the terminal as output, is interpreted as ASCII #42, or the `*` character.

These subtleties mean that programs which are written to perform basic arithmetic must be much more complex.

To ease the pain a bit, the `numin` and `numout` flags allow input and output, respectively, to be interpreted as numeric data, rather than characters. This greatly simplifies calculation. Here is [the Wikipedia-prescribed method for addition](https://en.wikipedia.org/wiki/Brainfuck#Adding_two_values) which is fragile and relies on hard-coded values

```ts
🧠: ++>+++++[<+>-]++++++++[<++++++>-]<.
7

🧠: ,>,[<+>-]++++++++[<++++++>-]<.

    Please provide a single character for ',' input:
    ❓: 2


    Please provide a single character for ',' input:
    ❓: 5

```

Above, the input `2` is interpreted as the _character_ `2` (ASCII #50) and `5` is interpreted as the _character_ `5` (ASCII #53). Adding them should yield `103` or the ASCII character `g`, but something has gone wrong. Try debugging that.

Instead, we can simply set `numin` and `numout` to true, and then provide any two 1 or 2-digit numbers to add to the following (much simpler) program:

```ts
🧠: ,>,[-<+>]<.

    Please provide a 1 or 2-digit number for ',' input:
    ❓: 2


    Please provide a 1 or 2-digit number for ',' input:
    ❓: 5

7

🧠: ,>,[-<+>]<.

    Please provide a 1 or 2-digit number for ',' input:
    ❓: 19


    Please provide a 1 or 2-digit number for ',' input:
    ❓: 42

61
```

We can even write a pretty simple multiplication program:

```ts
🧠: ,>,[-<[->>+>+<<<]>>[-<<+>>]<]>>.

    Please provide a 1 or 2-digit number for ',' input:
    ❓: 19


    Please provide a 1 or 2-digit number for ',' input:
    ❓: 34

646
```

`classic` is the last flag which can be toggled. There are two interpretation modes which `bf` and `brain` can run in. The default interpretation mode:

- allows cells with values on the range `[0, 2**32)`
- throws an error when the user tries to decrement a cell's value below `0`
- throws an error when the user tries to increment a cell's value above `2**32 - 1`
- throws an error when the user tries to move the memory pointer left when it's already on the cell at index `0`
- throws an error when the user tries to move the memory pointer right when it's already on the rightmost cell

The `classic` interpolation mode:

- allows cells with values on the range `[0, 256)`
- wraps around to `255` when the user decrements a cell with value `0`
- wraps around to `0` when the user increments a cell with value `255`
- wraps around to the rightmost cell when the memory pointer is on cell index `0` and the user tries to move it left
- wraps around to the cell at index `0` when the memory pointer is already on the rightmost cell and the user tries to move it right

Emoji and other characters beyond `0xFF` will only properly render in the default interpretation mode (`classic === false`), but some programs will only run in `classic` mode, for instance, [this code golfed "Hello World" from StackExchange](https://codegolf.stackexchange.com/a/68494/79936):

```ts
🧠: --<-<<+[+[<+>--->->->-<<<]>]<<--.<++++++.<<-..<<.<+.>>.>>.<<<.+++.>>.>>-.<<<+.

              --<-<<+[+[<+>-
Error at      ^      char index 0
  message: cell 0 is already at minimum allowable value, 0... try setting `classic` to `true`
   output: 


🧠: :classic

Changed interpretation mode to 'classic'

🧠: --<-<<+[+[<+>--->->->-<<<]>]<<--.<++++++.<<-..<<.<+.>>.>>.<<<.+++.>>.>>-.<<<+.
Hello, World!

🧠: 
```

## Known Issues

ANSI escape sequences (arrow keys, etc.) do not work properly in `brain`. This is being investigated.

## Contact

Feel free to open an issue with any `bug fixes` or a PR with any `performance improvements`.

Support me @ [Ko-fi](https://ko-fi.com/awwsmm)!

Check out [my DEV.to blog](https://dev.to/awwsmm)!