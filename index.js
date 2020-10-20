const escpos = require('escpos')
escpos.Network = require('escpos-network')

const device = new escpos.Network('192.168.200.200', 9100)

const printer = new escpos.Printer(device, {
  encoding: "GB18030"
})

const foldLine = (length, text = '') => {
  const lines = ['']
  for(let i = 0; i < text.length; i++) {
    if(i && i !== text.length - 1 && !(i % length)) {
      lines.push('')
    }
    lines[lines.length - 1] += text[i]
  }
  return lines
}

const { createCanvas } = require('canvas')
const width = 200
const height = 80
const scale = 1
const canvas = createCanvas(width * scale, height * scale)
const ctx = canvas.getContext('2d')
ctx.scale(scale, scale)

ctx.font = `14px Meiryo`

const tid = process.argv[2]
const data = process.argv.slice(3)

const lines = [
  `〒${data[0]}`,
  data[1] + data[2],
  data[3],
  data[4]
]

const offset = 15
let lineCount = 0
for(const str of lines) {
  for(const line of foldLine(14, str)) {
    ctx.fillText(line, 0, offset + lineCount * 15)
    lineCount++
  }
}

const getPixels = require("get-pixels")

canvas.toBuffer((err, buffer) => {
  if(err) {
    console.error(err)
    return
  }
  getPixels(buffer, "image/png", (err, pixels) => {
    if(err) {
      console.error(err)
      return
    }
    const image = new escpos.Image(pixels)
    device.open(() => {
      printer
        .align('ct')
        .image(image, 's8')
        .then((printer) => {
          printer
          .qrimage(tid.toString(), {
            type: 'png',
            mode: 'dhdw',
            size: 2
          }, (err) => {
            if(err) {
              console.error(err)
              return
            }
            printer
              .feed(3)
              .cut()
              .close()
            })
        })
    })
  })
})
