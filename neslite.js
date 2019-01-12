
// 指令集
const INST = {
    LDA=(s, x) => { STATE.A = M; PSW.N = x < 0; },
    // 流程控制指令
    JMP=M => STATE.PC = M,
    JSP=M => { STATE.SP = STATE.PC; STATE.PC = M; },
    RTS=() => STATE.PC = STATE.SP,
    // 处理器状态指令
    CLC=() => PSW.C = false,
    CLD=() => PSW.D = false,
    CLI=() => PSW.I = false,
    CLV=() => PSW.V = false,
    SEC=() => PSW.C = true,
    SED=() => PSW.D = true,
    SEI=() => PSW.I = true,
    // 传送指令
    TAX=() => STATE.X = STATE.A,
    TAY=() => STATE.Y = STATE.A,
    TXA=() => STATE.A = STATE.X,
    TYA=() => STATE.A = STATE.Y,
    // 特殊指令
    NOP=() => { },
    BRK=() => { STATE.SP = STATE.PC; STATE.PC = 0xFFFE; }
}

// 寻址方式
const ADDR = {
    IMM=s => s.RAM[s.PC++],
    ZPG=s => s.RAM[s.RAM[s.PC++]],
    ZPX=s => s.RAM[s.RAM[s.PC++] + s.X],
    ZPY=s => s.RAM[s.RAM[s.PC++] + s.Y],
    ABS=s => s.RAM[s.RAM[s.PC++] | s.RAM[s.PC++] << 8],
    ABX=s => s.RAM[s.RAM[s.PC++] | s.RAM[s.PC++] << 8 + s.X],
    ABY=s => s.RAM[s.RAM[s.PC++] | s.RAM[s.PC++] << 8 + s.Y],
    IND=s => { },
    INX=s => { },
    INY=s => { },
    SNG=s => 0,
    BRA=s => s.RAM[s.RAM[s.PC++] + s.PC]
}

// 操作码 - 汇编指令 - 寻址方式的对应关系
const OPTS = {
    0x69: [INST.ADC, ADDR.IMM],
    0x65: [INST.ADC, ADDR.ZPG],
    0x75: [INST.ADC, ADDR.ZPX],
    0x6D: [INST.ADC, ADDR.ABS],
    0x7D: [INST.ADC, ADDR.ABX],
    0x79: [INST.ADC, ADDR.ABY],
    0x61: [INST.ADC, ADDR.INX],
    0x71: [INST.ADC, ADDR.INY],
    0x29: [INST.AND, ADDR.IMM],
    0x25: [INST.AND, ADDR.ZPG],
    0x35: [INST.AND, ADDR.ZPX],
    0x2D: [INST.AND, ADDR.ABS],
    0x3D: [INST.AND, ADDR.ABX],
    0x39: [INST.AND, ADDR.ABY],
    0x21: [INST.AND, ADDR.INX],
    0x31: [INST.AND, ADDR.INY],
    0x06: [INST.ASL, ADDR.ZPG],
    0x16: [INST.ASL, ADDR.ZPX],
    0x0E: [INST.ASL, ADDR.ABS],
    0x1E: [INST.ASL, ADDR.ABX],
    0x0A: [INST.ASL, ADDR.SNG],
    0x24: [INST.BIT, ADDR.ZPG],
    0x2C: [INST.BIT, ADDR.ABS],
    0x10: [INST.BPL, ADDR.BRA],
    0x30: [INST.BMI, ADDR.BRA],
    0x50: [INST.BVC, ADDR.BRA],
    0x70: [INST.BVS, ADDR.BRA],
    0x90: [INST.BCC, ADDR.BRA],
    0xB0: [INST.BCS, ADDR.BRA],
    0xD0: [INST.BNE, ADDR.BRA],
    0xF0: [INST.BEQ, ADDR.BRA],
    0x00: [INST.BRK, ADDR.SNG],
    0xC9: [INST.CMP, ADDR.IMM],
    0xC5: [INST.CMP, ADDR.ZPG],
    0xD5: [INST.CMP, ADDR.ZPX],
    0xCD: [INST.CMP, ADDR.ABS],
    0xDD: [INST.CMP, ADDR.ABX],
    0xD9: [INST.CMP, ADDR.ABY],
    0xC1: [INST.CMP, ADDR.INX],
    0xD1: [INST.CMP, ADDR.INY],
    0xE0: [INST.CPX, ADDR.IMM],
    0xE4: [INST.CPX, ADDR.ZPG],
    0xEC: [INST.CPX, ADDR.ABS],
    0xC0: [INST.CPY, ADDR.IMM],
    0xC4: [INST.CPY, ADDR.ZPG],
    0xCC: [INST.CPY, ADDR.ABS],
    0xC6: [INST.DEC, ADDR.ZPG],
    0xD6: [INST.DEC, ADDR.ZPX],
    0xCE: [INST.DEC, ADDR.ABS],
    0xDE: [INST.DEC, ADDR.ABX],
    0x49: [INST.EOR, ADDR.IMM],
    0x45: [INST.EOR, ADDR.ZPG],
    0x55: [INST.EOR, ADDR.ZPX],
    0x4D: [INST.EOR, ADDR.ABS],
    0x5D: [INST.EOR, ADDR.ABX],
    0x59: [INST.EOR, ADDR.ABY],
    0x41: [INST.EOR, ADDR.INX],
    0x51: [INST.EOR, ADDR.INY],
    0x18: [INST.CLC, ADDR.SNG],
    0x38: [INST.SEC, ADDR.SNG],
    0x58: [INST.CLI, ADDR.SNG],
    0x78: [INST.SEI, ADDR.SNG],
    0xB8: [INST.CLV, ADDR.SNG],
    0xD8: [INST.CLD, ADDR.SNG],
    0xF8: [INST.SED, ADDR.SNG],
    0xE6: [INST.INC, ADDR.ZPG],
    0xF6: [INST.INC, ADDR.ZPX],
    0xEE: [INST.INC, ADDR.ABS],
    0xFE: [INST.INC, ADDR.ABX],
    0x4C: [INST.JMP, ADDR.ABS],
    0x6C: [INST.JMP, ADDR.IND],
    0x20: [INST.JSR, ADDR.ABS],
    0xA9: [INST.LDA, ADDR.IMM],
    0xA5: [INST.LDA, ADDR.ZPG],
    0xB5: [INST.LDA, ADDR.ZPX],
    0xAD: [INST.LDA, ADDR.ABS],
    0xBD: [INST.LDA, ADDR.ABX],
    0xB9: [INST.LDA, ADDR.ABY],
    0xA1: [INST.LDA, ADDR.INX],
    0xB1: [INST.LDA, ADDR.INY],
    0xA2: [INST.LDX, ADDR.IMM],
    0xA6: [INST.LDX, ADDR.ZPG],
    0xB6: [INST.LDX, ADDR.ZPY],
    0xAE: [INST.LDX, ADDR.ABS],
    0xBE: [INST.LDX, ADDR.ABY],
    0xA0: [INST.LDY, ADDR.IMM],
    0xA4: [INST.LDY, ADDR.ZPG],
    0xB4: [INST.LDY, ADDR.ZPX],
    0xAC: [INST.LDY, ADDR.ABS],
    0xBC: [INST.LDY, ADDR.ABX],
    0x46: [INST.LSR, ADDR.ZPG],
    0x56: [INST.LSR, ADDR.ZPX],
    0x4E: [INST.LSR, ADDR.ABS],
    0x5E: [INST.LSR, ADDR.ABX],
    0x4A: [INST.LSR, ADDR.SNG],
    0xEA: [INST.NOP, ADDR.SNG],
    0x09: [INST.ORA, ADDR.IMM],
    0x05: [INST.ORA, ADDR.ZPG],
    0x15: [INST.ORA, ADDR.ZPX],
    0x0D: [INST.ORA, ADDR.ABS],
    0x1D: [INST.ORA, ADDR.ABX],
    0x19: [INST.ORA, ADDR.ABY],
    0x01: [INST.ORA, ADDR.INX],
    0x11: [INST.ORA, ADDR.INY],
    0xAA: [INST.TAX, ADDR.SNG],
    0x8A: [INST.TXA, ADDR.SNG],
    0xCA: [INST.DEX, ADDR.SNG],
    0xE8: [INST.INX, ADDR.SNG],
    0xA8: [INST.TAY, ADDR.SNG],
    0x98: [INST.TYA, ADDR.SNG],
    0x88: [INST.DEY, ADDR.SNG],
    0xC8: [INST.INY, ADDR.SNG],
    0x66: [INST.ROR, ADDR.ZPG],
    0x76: [INST.ROR, ADDR.ZPX],
    0x6E: [INST.ROR, ADDR.ABS],
    0x7E: [INST.ROR, ADDR.ABX],
    0x6A: [INST.ROR, ADDR.SNG],
    0x26: [INST.ROL, ADDR.ZPG],
    0x36: [INST.ROL, ADDR.ZPX],
    0x2E: [INST.ROL, ADDR.ABS],
    0x3E: [INST.ROL, ADDR.ABX],
    0x2A: [INST.ROL, ADDR.SNG],
    0x40: [INST.RTI, ADDR.SNG],
    0x60: [INST.RTS, ADDR.SNG],
    0xE9: [INST.SBC, ADDR.IMM],
    0xE5: [INST.SBC, ADDR.ZPG],
    0xF5: [INST.SBC, ADDR.ZPX],
    0xED: [INST.SBC, ADDR.ABS],
    0xFD: [INST.SBC, ADDR.ABX],
    0xF9: [INST.SBC, ADDR.ABY],
    0xE1: [INST.SBC, ADDR.INX],
    0xF1: [INST.SBC, ADDR.INY],
    0x85: [INST.STA, ADDR.ZPG],
    0x95: [INST.STA, ADDR.ZPX],
    0x8D: [INST.STA, ADDR.ABS],
    0x9D: [INST.STA, ADDR.ABX],
    0x99: [INST.STA, ADDR.ABY],
    0x81: [INST.STA, ADDR.INX],
    0x91: [INST.STA, ADDR.INY],
    0x9A: [INST.TXS, ADDR.SNG],
    0xBA: [INST.TSX, ADDR.SNG],
    0x48: [INST.PHA, ADDR.SNG],
    0x68: [INST.PLA, ADDR.SNG],
    0x08: [INST.PHP, ADDR.SNG],
    0x28: [INST.PLP, ADDR.SNG],
    0x86: [INST.STX, ADDR.ZPG],
    0x96: [INST.STX, ADDR.ZPY],
    0x8E: [INST.STX, ADDR.ABS],
    0x84: [INST.STY, ADDR.ZPG],
    0x94: [INST.STY, ADDR.ZPX],
    0x8C: [INST.STY, ADDR.ABS],
    0x42: [INST.WDM, ADDR.IMM],
    0x42: [INST.WDM, ADDR.ZPG],
}


function start() {
    while (getByte()) {

    }
}

function readRom() {

}


export class NesLite {

    constructor() {
        this.A = this.X = this.Z = 0;
        this.PC = 0x600;
        this.SP = 0xff;
        this.P = 0;
        this.RAM = new int8Array[256 * 256];
    }

    setA(value) {
        this.A = value;
        setNV(A);
    }

    setX(value) {
        this.X = value;
        setNV(value);
    }
    setY(value) {
        this.Y = value;
        setNV(value);
    }

    setNV(value) {
        if (value) this.P &= 0xfd;
        else this.P |= 0x02;
        if (value & 0x80) this.P |= 0x80;
        else this.P &= 0x7f;
    }

    SetC(value, left) {
        if (left)
            this.P = (this.P & 0xfe) | (value & 1);
        else
            this.P = (this.P & 0xfe) | ((value >> 7) & 1);
    }

    push(value) {
        this.RAM[this.SP + 0x100] = value;
        if (--this.SP < 0)
            throw "Stack Overflow";
    }

    pop() {
        if (++this.SP >= 0x100)
            throw "Stack Empty";
        return this.RAM[this.SP + 0x100];
    }

}
