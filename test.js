const NesLite = require('./neslite')
const assert = require('assert');
const fs = require("fs");
let logs = fs.readFileSync('./testRom/nestest.log', 'utf-8').split('\n');
let logIndex = 0;
let latestLogs = [];
const color = require("colors");

/**
 * 用来输出运行日志的工具方法
 */
function log(nes, pos, inst, length) {
    // 格式化字节
    let fByte = i => i.toString(16).toUpperCase().padStart(2, '0');
    let fWord = i => i.toString(16).toUpperCase().padStart(4, '0');
    let code = "";
    for (let i = pos; i < pos + length; i++)
        code += fByte(nes.RAM[i]) + ' ';
    let log = fWord(pos) + '  ' // 地址
        + code.padEnd(10, ' ') // 机器码
        + inst.padEnd(4, ' ') // 指令名称
        + 'A:' + fByte(nes.A) + ' ' // A
        + 'X:' + fByte(nes.X) + ' ' // X
        + 'Y:' + fByte(nes.Y) + ' ' // Y
        + 'P:' + fByte(nes.P) + ' ' // P
        + 'SP:' + fByte(nes.SP) // SP
    if (logIndex == logs.length - 1)
        nes.Running = false;
    if (log == logs[logIndex]) {
        if (latestLogs.length > 10)
            latestLogs.splice(0, 1);
        latestLogs.push(logIndex.toString().padStart(4, '0') + '  ' + log.green)
    }
    else {
        latestLogs.forEach(x => console.log(x));
        console.log("++++  " + logs[logIndex].yellow);
        console.log("----  " + log.red);
        console.log("---------------------------")
        assert.fail("Log dismatch")
    }
    logIndex++;
}
describe("模拟器", () => {
    
    it("Stack Errors", () => {
        let s = new NesLite();
        s.SP = 0x0;
        s.push(0x19);
        assert.equal(s.Message, "Stack Overflow");
        s.SP = 0x100;
        s.pop();
        assert.equal(s.Message, "Stack Empty");
    });

    it("Load Errors", () => {
        let s = new NesLite();
        let result = s.load(new Uint8Array(64 * 1024));
        assert.equal(result, false);

    })

    it('CPU Test', () => {
        let s = new NesLite();
        s.log = log;
        let data = fs.readFileSync('./testRom/nestest.nes');
        s.load(data);
        s.PC = 0xC000;
        s.SP = 0xfd;
        s.P = 0x24;
        s.run();
    });
});