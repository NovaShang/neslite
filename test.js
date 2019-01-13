const NesLite = require('./neslite')
const assert = require('assert');

describe("模拟器", () => {
    describe("寻址方式", () => {
        it("IMM", () => {
            var s = new NesLite();
            assert.equal(s.ADDR.IMM(s), 0x600);
            assert.equal(s.PC, 0x600 + 1);
        });
        it("ZPG", () => {
            var s = new NesLite();
            s.RAM[0x600] = 0xF4;
            assert.equal(s.ADDR.ZPG(s), 0x00F4);
            assert.equal(s.PC, 0x600 + 1);
        });
        it("ZPX", () => {
            var s = new NesLite();
            s.X = 0x02;
            s.RAM[0x600] = 0xF4;
            assert.equal(s.ADDR.ZPX(s), 0x00F6);
            assert.equal(s.PC, 0x600 + 1);
        });
        it("ZPY", () => {
            var s = new NesLite();
            s.Y = 0x02;
            s.RAM[0x600] = 0xF4;
            assert.equal(s.ADDR.ZPY(s), 0x00F6);
            assert.equal(s.PC, 0x600 + 1);
        });
        it("ABS", () => {
            var s = new NesLite();
            s.RAM[0x600] = 0xF6;
            s.RAM[0x601] = 0x31;
            assert.equal(s.ADDR.ABS(s), 0x31F6);
            assert.equal(s.PC, 0x600 + 2);
        });
        it("ABX", () => {
            var s = new NesLite();
            s.RAM[0x600] = 0xF6;
            s.RAM[0x601] = 0x31;
            s.X = 0x02;
            assert.equal(s.ADDR.ABX(s), 0x31F8);
            assert.equal(s.PC, 0x600 + 2);
        });
        it("ABY", () => {
            var s = new NesLite();
            s.RAM[0x600] = 0xF6;
            s.RAM[0x601] = 0x31;
            s.Y = 0x02;
            assert.equal(s.ADDR.ABY(s), 0x31F8);
            assert.equal(s.PC, 0x600 + 2);
        });
        it("IND", () => {
            var s = new NesLite();
            s.RAM[0x600] = 0x5F;
            s.RAM[0x601] = 0x21;
            s.RAM[0x215F] = 0x76;
            s.RAM[0x2160] = 0x30;
            assert.equal(s.ADDR.IND(s), 0x3076);
            assert.equal(s.PC, 0x600 + 2);
        });
        it("INX", () => {
            var s = new NesLite();
            s.X = 0x05;
            s.RAM[0x600] = 0x3E;
            s.RAM[0x0043] = 0x15;
            s.RAM[0x0044] = 0x24;
            assert.equal(s.ADDR.INX(s), 0x2415);
            assert.equal(s.PC, 0x600 + 1);
        });
        it("INY", () => {
            var s = new NesLite();
            s.Y = 0x05;
            s.RAM[0x600] = 0x3E;
            s.RAM[0x0043] = 0x15;
            s.RAM[0x0044] = 0x24;
            assert.equal(s.ADDR.INY(s), 0x2415);
            assert.equal(s.PC, 0x600 + 1);
        });
        it("BRA", () => {
            var s = new NesLite();
            s.RAM[0x600] = 0xA7;
            s.RAM[0x601] = 0x12;
            assert.equal(s.ADDR.BRA(s), -(0x100 - 0xA7) + 0x601);
            assert.equal(s.PC, 0x600 + 1);
            assert.equal(s.ADDR.BRA(s), 0x602 + 0x12);
        });
        it("SNG", () => {
            var s = new NesLite();
            s.ADDR.SNG(s);
            assert.equal(s.PC, 0x600);
        });
    })
});