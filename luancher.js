const NesLite = require('./neslite')
const fs = require("fs");
const color = require("colors");

let logs = fs.readFileSync('./testRom/nestest.log', 'utf-8').split('\n');
let logIndex = 0;

function log(nes, pos, inst, length) {
    // 格式化字节
    let fByte = i => i.toString(16).toUpperCase().padStart(2, '0');
    let fWord = i => i.toString(16).toUpperCase().padStart(4, '0');
    let code = "";
    for (let i = pos; i < pos + length; i++)
        code += fByte(nes.RAM[i]) + ' ';
    let log = fWord(pos) + '  ' // 地址
        + code.toUpperCase().padEnd(10, ' ') // 机器码
        + inst.padEnd(4, ' ') // 指令名称
        + 'A:' + fByte(nes.A) + ' ' // A
        + 'X:' + fByte(nes.X) + ' ' // X
        + 'Y:' + fByte(nes.Y) + ' ' // Y
        + 'P:' + fByte(nes.P) + ' ' // P
        + 'SP:' + fByte(nes.SP) // SP
    if (log == logs[logIndex])
        console.log(logIndex.toString().padStart(4, '0') + '  ' + log.green);
    else {
        console.log("++++++" + logs[logIndex]);
        console.log("------" + log.red);
    }
    logIndex++;
}

let s = new NesLite();
s.log = log;
let data = fs.readFileSync('./testRom/nestest.nes');
s.load(data);
s.PC = 0xC000;
s.run();


