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
            s.RAM[0x602] = 0x12;
            assert.equal(s.ADDR.BRA(s), -(0x100 - 0xA7));
            assert.equal(s.PC, 0x600 + 1);
            assert.equal(s.ADDR.BRA(s), 0x12);
            s.setFlag(s.FLAG.N, true);
            assert.equal(s.ADDR.BRA(s), -0x12);
        });
        it("SNG", () => {
            var s = new NesLite();
            s.ADDR.SNG(s);
            assert.equal(s.PC, 0x600);
        });
    });
    describe("工具方法", () => {
        it("Set Flag", () => {
            var s = new NesLite();
            s.setFlag(s.FLAG.C, 1);
            s.setFlag(s.FLAG.N, 1);
            s.setFlag(s.FLAG.C, 0);
            s.setFlag(s.FLAG.Z, 1);
            s.setFlag(s.FLAG.V, 0);
            assert.equal(s.P, 0x82);
        });
        it("Get Flag", () => {
            var s = new NesLite();
            s.P = 0x82;
            assert.equal(s.getFlag(s.FLAG.N), 1);
            assert.equal(s.getFlag(s.FLAG.Z), 1);
            assert.equal(s.getFlag(s.FLAG.C), 0);
            assert.equal(s.getFlag(s.FLAG.V), 0);
        });
        it("Stack Push", () => {
            var s = new NesLite();
            s.push(0x12);
            s.push(0x13);
            assert.equal(s.RAM[0x1FF], 0x12);
            assert.equal(s.RAM[0x1FE], 0x13);
            assert.equal(s.SP, 0xFD);
            s.SP = 0x0;
            s.push(0x19);
            assert.equal(s.Message, "Stack Overflow")
        });
        it("Stack Pop", () => {
            var s = new NesLite();
            s.RAM[0x1FF] = 0x12;
            s.RAM[0x1FE] = 0x13;
            s.SP = 0xFD;
            assert.equal(s.pop(), 0x13);
            assert.equal(s.pop(), 0x12);
            assert.equal(s.SP, 0xFF);
            s.SP = 0x100;
            s.pop();
            assert.equal(s.Message, "Stack Empty")
        });
        it("Set NZ For Value : Pos", () => {
            var s = new NesLite();
            s.setNZ(0x10);
            assert.equal(s.getFlag(s.FLAG.N), 0);
            assert.equal(s.getFlag(s.FLAG.Z), 0);
            assert.equal(s.getFlag(s.FLAG.C), 0);
        });
        it("Set NZ For Value : Neg", () => {
            var s = new NesLite();
            s.setNZ(0xA7);
            assert.equal(s.getFlag(s.FLAG.N), 1);
            assert.equal(s.getFlag(s.FLAG.Z), 0);
            assert.equal(s.getFlag(s.FLAG.C), 0);
        });
        it("Set NZ For Value : Zero", () => {
            var s = new NesLite();
            s.setNZ(0);
            assert.equal(s.getFlag(s.FLAG.N), 0);
            assert.equal(s.getFlag(s.FLAG.Z), 1);
            assert.equal(s.getFlag(s.FLAG.C), 0);
        });
        it("Set A", () => {
            var s = new NesLite();
            s.setA(0xA7);
            assert.equal(s.A, 0xA7);
            assert.equal(s.getFlag(s.FLAG.N), 1);
        });
        it("Set X", () => {
            var s = new NesLite();
            s.setX(0xA7);
            assert.equal(s.X, 0xA7);
            assert.equal(s.getFlag(s.FLAG.N), 1);
        });
        it("Set Y", () => {
            var s = new NesLite();
            s.setY(0xA7);
            assert.equal(s.Y, 0xA7);
            assert.equal(s.getFlag(s.FLAG.N), 1);
        });
    });
    describe("指令集", () => {
        it("LDA", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 66;
            s.INST.LDA(s, 0x1000);
            assert.equal(s.A, 66);
        });
        it("LDX", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 66;
            s.INST.LDX(s, 0x1000);
            assert.equal(s.X, 66);
        });
        it("LDY", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 66;
            s.INST.LDY(s, 0x1000);
            assert.equal(s.Y, 66);
        });
        it("STA", () => {
            let s = new NesLite();
            s.setA(66);
            s.INST.STA(s, 0x1000);
            assert.equal(s.RAM[0x1000], 66);
        });
        it("STX", () => {
            let s = new NesLite();
            s.setX(66);
            s.INST.STX(s, 0x1000);
            assert.equal(s.RAM[0x1000], 66);
        });
        it("STY", () => {
            let s = new NesLite();
            s.setY(66);
            s.INST.STY(s, 0x1000);
            assert.equal(s.RAM[0x1000], 66);
        });
        it("STY", () => {
            let s = new NesLite();
            s.INST.STZ(s, 0x1000);
            assert.equal(s.RAM[0x1000], 0);
        });
        it("ADC No Carry", () => {
            let s = new NesLite();
            s.setA(66);
            s.setFlag(s.FLAG.C, 1);
            s.RAM[0x1000] = 3;
            s.INST.ADC(s, 0x1000);
            assert.equal(s.A, 70);
            assert.equal(s.getFlag(s.FLAG.C), 0);
            assert.equal(s.getFlag(s.FLAG.V), 0);
        });
        it("ADC Carry", () => {
            let s = new NesLite();
            s.setA(200);
            s.setFlag(s.FLAG.C, 1);
            s.RAM[0x1000] = 200;
            s.INST.ADC(s, 0x1000);
            assert.equal(s.A, 145);
            assert.equal(s.getFlag(s.FLAG.C), 1);
            assert.equal(s.getFlag(s.FLAG.V), 0);
        });
        it("ADC Overflow", () => {
            let s = new NesLite();
            s.setA(129);
            s.setFlag(s.FLAG.C, 1);
            s.RAM[0x1000] = 200;
            s.INST.ADC(s, 0x1000);
            assert.equal(s.A, 74);
            assert.equal(s.getFlag(s.FLAG.C), 1);
            assert.equal(s.getFlag(s.FLAG.V), 1);
        });
        it("SBC No Borrow", () => {
            let s = new NesLite();
            s.setA(200);
            s.setFlag(s.FLAG.C, 1);
            s.RAM[0x1000] = 100;
            s.INST.SBC(s, 0x1000);
            assert.equal(s.A, 100);
            assert.equal(s.getFlag(s.FLAG.C), 1);
            assert.equal(s.getFlag(s.FLAG.V), 1);
        });
        it("SBC Borrow", () => {
            let s = new NesLite();
            s.setA(100);
            s.setFlag(s.FLAG.C, 0);
            s.RAM[0x1000] = 200;
            s.INST.SBC(s, 0x1000);
            assert.equal(s.A, 155);
            assert.equal(s.getFlag(s.FLAG.C), 0);
            assert.equal(s.getFlag(s.FLAG.V), 1);
        });
        it("SBC Zero", () => {
            let s = new NesLite();
            s.setA(100);
            s.setFlag(s.FLAG.C, 0);
            s.RAM[0x1000] = 100;
            s.INST.SBC(s, 0x1000);
            assert.equal(s.A, 255);
            assert.equal(s.getFlag(s.FLAG.C), 0);
            assert.equal(s.getFlag(s.FLAG.V), 0);
        });
        it("INC", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 200;
            s.INST.INC(s, 0x1000);
            assert.equal(s.RAM[0x1000], 201);
        });
        it("DEC", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 200;
            s.INST.DEC(s, 0x1000);
            assert.equal(s.RAM[0x1000], 199);
        });
        it("AND", () => {
            let s = new NesLite();
            s.setA(100);
            s.RAM[0x1000] = 200;
            s.INST.AND(s, 0x1000);
            assert.equal(s.A, 64);
        });
        it("ORA", () => {
            let s = new NesLite();
            s.setA(100);
            s.RAM[0x1000] = 200;
            s.INST.ORA(s, 0x1000);
            assert.equal(s.A, 236);
        });
        it("EOR", () => {
            let s = new NesLite();
            s.setA(100);
            s.RAM[0x1000] = 200;
            s.INST.EOR(s, 0x1000);
            assert.equal(s.A, 172);
        });
        it("INX", () => {
            let s = new NesLite();
            s.setX(100);
            s.INST.INX(s, 0);
            assert.equal(s.X, 101);
        });
        it("DEX", () => {
            let s = new NesLite();
            s.setX(100);
            s.INST.DEX(s, 0);
            assert.equal(s.X, 99);
        });
        it("INY", () => {
            let s = new NesLite();
            s.setY(100);
            s.INST.INY(s, 0);
            assert.equal(s.Y, 101);
        });
        it("DEY", () => {
            let s = new NesLite();
            s.setY(100);
            s.INST.DEY(s, 0);
            assert.equal(s.Y, 99);
        });
        it("INA", () => {
            let s = new NesLite();
            s.setA(100);
            s.INST.INA(s, 0);
            assert.equal(s.A, 101);
        });
        it("DEA", () => {
            let s = new NesLite();
            s.setA(100);
            s.INST.DEA(s, 0);
            assert.equal(s.A, 99);
        });
        it("TAX", () => {
            let s = new NesLite();
            s.setA(100);
            s.INST.TAX(s, 0);
            assert.equal(s.X, 100);
        });
        it("TXA", () => {
            let s = new NesLite();
            s.setX(100);
            s.INST.TXA(s, 0);
            assert.equal(s.A, 100);
        });
        it("TAY", () => {
            let s = new NesLite();
            s.setA(100);
            s.INST.TAY(s, 0);
            assert.equal(s.Y, 100);
        });
        it("TYA", () => {
            let s = new NesLite();
            s.setY(100);
            s.INST.TYA(s, 0);
            assert.equal(s.A, 100);
        });
        it("TSX", () => {
            let s = new NesLite();
            s.SP = 100;
            s.INST.TSX(s, 0);
            assert.equal(s.X, 100);
        });
        it("TXS", () => {
            let s = new NesLite();
            s.setX(100);
            s.INST.TXS(s, 0);
            assert.equal(s.SP, 100);
        });
        it("CLC", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.C, 1);
            s.INST.CLC(s, 0);
            assert.equal(s.getFlag(s.FLAG.C), 0);
        });
        it("SEC", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.C, 0);
            s.INST.SEC(s, 0);
            assert.equal(s.getFlag(s.FLAG.C), 1);
        });
        it("CLD", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.D, 1);
            s.INST.CLD(s, 0);
            assert.equal(s.getFlag(s.FLAG.D), 0);
        });
        it("SED", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.D, 0);
            s.INST.SED(s, 0);
            assert.equal(s.getFlag(s.FLAG.D), 1);
        });
        it("CLV", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.V, 1);
            s.INST.CLV(s, 0);
            assert.equal(s.getFlag(s.FLAG.V), 0);
        });
        it("SEI", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.I, 0);
            s.INST.SEI(s, 0);
            assert.equal(s.getFlag(s.FLAG.I), 1);
        });
        it("CLI", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.I, 1);
            s.INST.CLI(s, 0);
            assert.equal(s.getFlag(s.FLAG.I), 0);
        });
        it("CMP Smaller", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 210;
            s.setA(200);
            s.INST.CMP(s, 0x1000);
            assert.equal(s.getFlag(s.FLAG.N), 1);
            assert.equal(s.getFlag(s.FLAG.C), 0);
            assert.equal(s.getFlag(s.FLAG.Z), 0);
        });
        it("CMP Bigger", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 200;
            s.setA(210);
            s.INST.CMP(s, 0x1000);
            assert.equal(s.getFlag(s.FLAG.N), 0);
            assert.equal(s.getFlag(s.FLAG.C), 1);
            assert.equal(s.getFlag(s.FLAG.Z), 0);
        });
        it("CMP Same", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 100;
            s.setA(100);
            s.INST.CMP(s, 0x1000);
            assert.equal(s.getFlag(s.FLAG.N), 0);
            assert.equal(s.getFlag(s.FLAG.C), 1);
            assert.equal(s.getFlag(s.FLAG.Z), 1);
        });
        it("CPX", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 210;
            s.setX(200);
            s.INST.CPX(s, 0x1000);
            assert.equal(s.getFlag(s.FLAG.N), 1);
            assert.equal(s.getFlag(s.FLAG.C), 0);
            assert.equal(s.getFlag(s.FLAG.Z), 0);
        });
        it("CPY", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 210;
            s.setY(200);
            s.INST.CPY(s, 0x1000);
            assert.equal(s.getFlag(s.FLAG.N), 1);
            assert.equal(s.getFlag(s.FLAG.C), 0);
            assert.equal(s.getFlag(s.FLAG.Z), 0);
        });
        it("BIT Z1N0V1", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 0x64;
            s.setA(0x9B);
            s.INST.BIT(s, 0x1000);
            assert.equal(s.getFlag(s.FLAG.Z), 1);
            assert.equal(s.getFlag(s.FLAG.N), 0);
            assert.equal(s.getFlag(s.FLAG.V), 1);
        });
        it("BIT Z0N1V0", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 0xB2;
            s.setA(0x9B);
            s.INST.BIT(s, 0x1000);
            assert.equal(s.getFlag(s.FLAG.Z), 0);
            assert.equal(s.getFlag(s.FLAG.N), 1);
            assert.equal(s.getFlag(s.FLAG.V), 0);
        });
        it("ASL", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 0xB2;
            s.setFlag(s.FLAG.C, 1);
            s.INST.ASL(s, 0x1000);
            assert.equal(s.RAM[0x1000], 0x64);
            assert.equal(s.getFlag(s.FLAG.C), 1);
        });
        it("ROL", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 0xB2;
            s.setFlag(s.FLAG.C, 1);
            s.INST.ROL(s, 0x1000);
            assert.equal(s.RAM[0x1000], 0x65);
            assert.equal(s.getFlag(s.FLAG.C), 1);
        });
        it("LSR", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 0xB3;
            s.setFlag(s.FLAG.C, 1);
            s.INST.LSR(s, 0x1000);
            assert.equal(s.RAM[0x1000], 0x59);
            assert.equal(s.getFlag(s.FLAG.C), 1);
        });
        it("ROR", () => {
            let s = new NesLite();
            s.RAM[0x1000] = 0xB3;
            s.setFlag(s.FLAG.C, 1);
            s.INST.ROR(s, 0x1000);
            assert.equal(s.RAM[0x1000], 0xD9);
            assert.equal(s.getFlag(s.FLAG.C), 1);
        });
        it("PHA", () => {
            let s = new NesLite();
            s.setA(0xB3);
            s.INST.PHA(s, 0);
            assert.equal(s.RAM[0x1FF], 0xB3);
            assert.equal(s.SP, 0xFE);
        });
        it("PLA", () => {
            let s = new NesLite();
            s.SP = 0xFE;
            s.RAM[0x1FF] = 0xB3
            s.INST.PLA(s, 0);
            assert.equal(s.A, 0xB3);
            assert.equal(s.SP, 0xFF);
        });
        it("PHX", () => {
            let s = new NesLite();
            s.setX(0xB3);
            s.INST.PHX(s, 0);
            assert.equal(s.RAM[0x1FF], 0xB3);
            assert.equal(s.SP, 0xFE);
        });
        it("PLX", () => {
            let s = new NesLite();
            s.SP = 0xFE;
            s.RAM[0x1FF] = 0xB3
            s.INST.PLX(s, 0);
            assert.equal(s.X, 0xB3);
            assert.equal(s.SP, 0xFF);
        });
        it("PHY", () => {
            let s = new NesLite();
            s.setY(0xB3);
            s.INST.PHY(s, 0);
            assert.equal(s.RAM[0x1FF], 0xB3);
            assert.equal(s.SP, 0xFE);
        });
        it("PLY", () => {
            let s = new NesLite();
            s.SP = 0xFE;
            s.RAM[0x1FF] = 0xB3
            s.INST.PLY(s, 0);
            assert.equal(s.Y, 0xB3);
            assert.equal(s.SP, 0xFF);
        });
        it("PHP", () => {
            let s = new NesLite();
            s.P = 0xC7;
            s.INST.PHP(s, 0);
            assert.equal(s.RAM[0x1FF], 0xD7);
            assert.equal(s.SP, 0xFE);
        });
        it("PLP", () => {
            let s = new NesLite();
            s.SP = 0xFE;
            s.RAM[0x1FF] = 0xC3;
            s.INST.PLP(s, 0);
            assert.equal(s.getFlag(s.FLAG.B), 1);
            assert.equal(s.getFlag(s.FLAG.N), 1);
        });
        it("JMP", () => {
            let s = new NesLite();
            s.INST.JMP(s, 0x1000);
            assert.equal(s.PC, 0x1000);
        });
        it("BEQ True", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.Z, 1);
            s.INST.BEQ(s, 0x100);
            assert.equal(s.PC, 0x700);
        });
        it("BEQ False", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.Z, 0);
            s.INST.BEQ(s, 0x100);
            assert.equal(s.PC, 0x600);
        });
        it("BNE True", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.Z, 1);
            s.INST.BNE(s, 0x100);
            assert.equal(s.PC, 0x600);
        });
        it("BNE False", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.Z, 0);
            s.INST.BNE(s, 0x100);
            assert.equal(s.PC, 0x700);
        });
        it("BCS True", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.C, 1);
            s.INST.BCS(s, 0x100);
            assert.equal(s.PC, 0x700);
        });
        it("BCS False", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.C, 0);
            s.INST.BCS(s, 0x100);
            assert.equal(s.PC, 0x600);
        });
        it("BCC True", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.C, 1);
            s.INST.BCC(s, 0x100);
            assert.equal(s.PC, 0x600);
        });
        it("BCC False", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.C, 0);
            s.INST.BCC(s, 0x100);
            assert.equal(s.PC, 0x700);
        });
        it("BVS True", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.V, 1);
            s.INST.BVS(s, 0x100);
            assert.equal(s.PC, 0x700);
        });
        it("BVS False", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.V, 0);
            s.INST.BVS(s, 0x100);
            assert.equal(s.PC, 0x600);
        });
        it("BVC True", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.V, 1);
            s.INST.BVC(s, 0x100);
            assert.equal(s.PC, 0x600);
        });
        it("BVC False", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.V, 0);
            s.INST.BVC(s, 0x100);
            assert.equal(s.PC, 0x700);
        });
        it("JSR", () => {
            let s = new NesLite();
            s.PC = 0x622;
            s.INST.JSR(s, 0x800);
            assert.equal(s.PC, 0x800);
            assert.equal(s.RAM[0x1FF], 0x6);
            assert.equal(s.RAM[0x1FE], 0x21);
        });
        it("RTS", () => {
            let s = new NesLite();
            s.SP = 0xFD;
            s.RAM[0x1FF] = 0x6;
            s.RAM[0x1FE] = 0x21;
            s.INST.RTS(s);
            assert.equal(s.PC, 0x622);
        });
        it("NOP", () => {
            let s = new NesLite();
            s.INST.NOP(s);
        });
        it("BRK", () => {
            let s = new NesLite();
            s.PC = 0x622;
            s.RAM[0xFFFE] = 0x30;
            s.RAM[0xFFFF] = 0x40;
            s.setFlag(s.FLAG.N, 1);
            s.INST.BRK(s);
            assert.equal(s.RAM[0x1FF], 0x06);
            assert.equal(s.RAM[0x1FE], 0x23);
            assert.equal(s.PC, 0x4030);
            assert.equal(s.getFlag(s.FLAG.I), true);
            assert.equal((s.RAM[0x1FD] & s.FLAG.N) > 0, true);
        });
        it("RTI", () => {
            let s = new NesLite();
            s.RAM[0x1FF] = 0x06;
            s.RAM[0x1FE] = 0x23;
            s.RAM[0x1FD] = s.FLAG.N | s.FLAG.V | s.FLAG.B;
            s.PC = 0x4030;
            s.SP = 0xFC;
            s.INST.RTI(s);
            assert.equal(s.PC, 0x0623);
            assert.equal(s.getFlag(s.FLAG.N), true);
            assert.equal(s.getFlag(s.FLAG.V), true);
            assert.equal(s.getFlag(s.FLAG.B), false);
        });
        it("BRA", () => {
            let s = new NesLite();
            s.INST.BRA(s, 0x10);
            assert.equal(s.PC, 0x0610);
        });
        it("BMI POS", () => {
            let s = new NesLite();
            s.INST.BMI(s, 0x10);
            assert.equal(s.PC, 0x0600);
        });
        it("BMI NEG", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.N, true);
            s.INST.BMI(s, 0x10);
            assert.equal(s.PC, 0x0610);
        });
        it("BPL POS", () => {
            let s = new NesLite();
            s.INST.BPL(s, 0x10);
            assert.equal(s.PC, 0x0610);
        });
        it("BPL NEG", () => {
            let s = new NesLite();
            s.setFlag(s.FLAG.N, true);
            s.INST.BPL(s, 0x10);
            assert.equal(s.PC, 0x0600);
        });


    });
});