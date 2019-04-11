
// P位的各个Flag
const FLAG = {
    N: 0x80, V: 0x40, B: 0x10, R: 0x20,
    D: 0x08, I: 0x04, Z: 0x02, C: 0x01
}

// 指令集
const I = {

    // 读取与储存
    LDA: (s, a) => s.setA(s.RAM[a]),
    LDX: (s, a) => s.setX(s.RAM[a]),
    LDY: (s, a) => s.setY(s.RAM[a]),
    STA: (s, a) => s.RAM[a] = s.A,
    STX: (s, a) => s.RAM[a] = s.X,
    STY: (s, a) => s.RAM[a] = s.Y,
    STZ: (s, a) => s.RAM[a] = 0,

    // 堆栈操作
    PHA: (s, a) => s.push(s.A),
    PHX: (s, a) => s.push(s.X),
    PHY: (s, a) => s.push(s.Y),
    PHP: (s, a) => s.push(s.P | FLAG.B),
    PLA: (s, a) => s.setA(s.pop()),
    PLX: (s, a) => s.setX(s.pop()),
    PLY: (s, a) => s.setY(s.pop()),
    PLP: (s, a) => {
        s.P = s.pop();
        s.setFlag(FLAG.B, 0);
        s.setFlag(FLAG.R, 1);
    },
    TSX: (s, a) => s.setX(s.SP),
    TXS: (s, a) => s.SP = s.X,

    // 递增与递减
    INA: (s, a) => s.setA(s.A + 1),
    INX: (s, a) => s.setX(s.X + 1),
    INY: (s, a) => s.setY(s.Y + 1),
    DEA: (s, a) => s.setA(s.A - 1),
    DEX: (s, a) => s.setX(s.X - 1),
    DEY: (s, a) => s.setY(s.Y - 1),
    INC: (s, a) => s.setNZ(s.RAM[a] = (s.RAM[a] + 1) & 0xFF),
    DEC: (s, a) => s.setNZ(s.RAM[a] = (s.RAM[a] - 1) & 0xFF),

    // 移动位置操作
    ASL: (s, a) => {
        let value = a == -1 ? s.A : s.RAM[a];
        let flag = value >> 7 & 1 != 0;
        value = (value << 1) & 0xff;
        s.setFlag(FLAG.C, flag);
        s.setNZ(value);
        a == -1 ? s.A = value : s.RAM[a] = value;
    },
    LSR: (s, a) => {
        let value = a == -1 ? s.A : s.RAM[a];
        let flag = value & 1 != 0;
        value = value >> 1;
        s.setFlag(FLAG.C, flag);
        s.setNZ(value);
        a == -1 ? s.A = value : s.RAM[a] = value;
    },
    ROL: (s, a) => {
        let value = a == -1 ? s.A : s.RAM[a];
        let flag = value >> 7 & 1;
        value = ((value << 1) | s.getFlag(FLAG.C)) & 0xff;
        s.setFlag(FLAG.C, flag);
        s.setNZ(value);
        a == -1 ? s.A = value : s.RAM[a] = value;
    },
    ROR: (s, a) => {
        let value = a == -1 ? s.A : s.RAM[a];
        let flag = value & 1 != 0;
        value = (value >> 1) | (s.getFlag(FLAG.C) << 7);
        s.setFlag(FLAG.C, flag);
        s.setNZ(value);
        a == -1 ? s.A = value : s.RAM[a] = value;
    },

    // 逻辑操作
    AND: (s, a) => s.setA(s.A & s.RAM[a]),
    ORA: (s, a) => s.setA(s.A | s.RAM[a]),
    EOR: (s, a) => s.setA(s.A ^ s.RAM[a]),
    CMP: (s, a) => s.setNZC(s.A - s.RAM[a]),
    CPX: (s, a) => s.setNZC(s.X - s.RAM[a]),
    CPY: (s, a) => s.setNZC(s.Y - s.RAM[a]),
    BIT: (s, a) => {
        let t = s.RAM[a];
        s.setFlag(FLAG.N, t >> 7 & 1);
        s.setFlag(FLAG.V, t >> 6 & 1);
        s.setFlag(FLAG.Z, s.A & t ? 0 : 1);
    },

    // 算术操作
    ADC: (s, a) => {
        let m = s.RAM[a];
        let t = s.A + m + s.getFlag(FLAG.C);
        s.setFlag(FLAG.C, (t >> 8) > 0);
        s.setFlag(FLAG.V, !((s.A ^ m) & 0x80) && ((s.A ^ t) & 0x80))
        s.setA(t & 0xFF);
    },
    SBC: (s, a) => {
        let m = s.RAM[a];
        let t = s.A - m - (1 - s.getFlag(FLAG.C));
        s.setFlag(FLAG.C, !(t >> 8));
        s.setFlag(FLAG.V, ((s.A ^ t) & 0x80) && ((s.A ^ m) & 0x80));
        s.setA(t & 0xFF);
    },

    // 流程控制
    JMP: (s, a) => s.PC = a,
    RTS: (s, a) => s.PC = (s.pop() | (s.pop() << 8)) + 1,
    BRA: (s, a) => s.PC += a,
    BEQ: (s, a) => s.getFlag(FLAG.Z) ? s.PC += a : 0,
    BNE: (s, a) => s.getFlag(FLAG.Z) ? 0 : s.PC += a,
    BCS: (s, a) => s.getFlag(FLAG.C) ? s.PC += a : 0,
    BCC: (s, a) => s.getFlag(FLAG.C) ? 0 : s.PC += a,
    BVS: (s, a) => s.getFlag(FLAG.V) ? s.PC += a : 0,
    BVC: (s, a) => s.getFlag(FLAG.V) ? 0 : s.PC += a,
    BMI: (s, a) => s.getFlag(FLAG.N) ? s.PC += a : 0,
    BPL: (s, a) => s.getFlag(FLAG.N) ? 0 : s.PC += a,
    JSR: (s, a) => {
        s.PC--;
        s.push(s.PC >> 8);
        s.push(s.PC & 0xFF);
        s.PC = a;
    },
    RTI: (s, a) => {
        s.P = s.pop();
        s.setFlag(FLAG.B, 0);
        s.setFlag(FLAG.R, 1);
        s.PC = s.pop() | (s.pop() << 8);
    },

    // 处理器状态
    CLC: (s, a) => s.setFlag(FLAG.C, 0),
    CLD: (s, a) => s.setFlag(FLAG.D, 0),
    CLI: (s, a) => s.setFlag(FLAG.I, 0),
    CLV: (s, a) => s.setFlag(FLAG.V, 0),
    SEC: (s, a) => s.setFlag(FLAG.C, 1),
    SED: (s, a) => s.setFlag(FLAG.D, 1),
    SEI: (s, a) => s.setFlag(FLAG.I, 1),

    // 传送指令
    TAX: (s, a) => s.setX(s.A),
    TAY: (s, a) => s.setY(s.A),
    TXA: (s, a) => s.setA(s.X),
    TYA: (s, a) => s.setA(s.Y),

    // 特殊指令
    NOP: (s, a) => { },
    BRK: (s, a) => {
        s.PC++;
        s.push(s.PC >> 8);
        s.push(s.PC & 0xFF);
        s.push(s.P | FLAG.B);
        s.setFlag(FLAG.I, 1);
        s.PC = s.RAM[0xFFFE] | (s.RAM[0xFFFF] << 8);
    },

    //扩展指令
    LAX: (s, a) => s.setNZ(s.X = s.A = s.RAM[a]),
    ASR: (s, a) => I.LSR(s.A & s.RAM[a]),
    ANC: (s, a) => {
        s.setNZ(s.A = A & s.RAM[a]);
        s.setFlag(FLAG.C, s.getFlag(FLAG.N));
    },
    ARR: (s, a) => I.ROR(s.A & s.RAM[a]),
    SAX: (s, a) => s.RAM[a] = s.A & s.X,
    DCP: (s, a) => { s.RAM[a]--; I.CMP(s, a); },
    ISB: (s, a) => { s.RAM[a]++; I.SBC(s, a); },
    SLO: (s, a) => { I.ASL(s, a); I.ORA(s, a); },
    RLA: (s, a) => { I.ROL(s, a); I.AND(s, a); },
    SRE: (s, a) => { I.LSR(s, a); I.EOR(s, a); },
    RRA: (s, a) => { I.ROR(s, a); I.ADC(s, a); }
}

// 寻址方式
const A = {
    IMM: s => s.PC++,
    ZPG: s => s.RAM[s.PC++],
    ZPX: s => (s.RAM[s.PC++] + s.X) & 0xFF,
    ZPY: s => (s.RAM[s.PC++] + s.Y) & 0xFF,
    ABS: s => s.RAM[s.PC++] | (s.RAM[s.PC++] << 8),
    ABX: s => ((s.RAM[s.PC++] | (s.RAM[s.PC++] << 8)) + s.X) & 0xFFFF,
    ABY: s => ((s.RAM[s.PC++] | (s.RAM[s.PC++] << 8)) + s.Y) & 0xFFFF,
    IND: s => {
        let t1 = s.RAM[s.PC++] | (s.RAM[s.PC++] << 8);
        let t2 = (t1 & 0xFF00) | ((t1 + 1) & 0x00FF);// 复原6052的bug
        return s.RAM[t1] | (s.RAM[t2] << 8);
    },
    INX: s => {
        let t = s.RAM[s.PC++] + s.X;
        return s.RAM[t & 0xFF] | (s.RAM[(t + 1) & 0xFF] << 8);
    },
    INY: s => {
        let t = s.RAM[s.PC++];
        return ((s.RAM[t & 0xFF] | (s.RAM[(t + 1) & 0xFF] << 8))
            + s.Y) & 0xFFFF;
    },
    SNG: s => -1,
    BRA: s => {
        let offset = s.RAM[s.PC++];
        offset = (offset > 0x7f) ? - (0x100 - offset) : offset;
        return offset;
    },
}

// 操作码 - 汇编指令 - 寻址方式的对应关系
const OPTS = {
    0x00: [A.SNG, I.BRK, 7], 0x01: [A.INX, I.ORA, 6], 0x02: [A.SNG, I.HK2, 2], 0x03: [A.INX, I.SLO, 8],
    0x04: [A.ZPG, I.NOP, 3], 0x05: [A.ZPG, I.ORA, 3], 0x06: [A.ZPG, I.ASL, 5], 0x07: [A.ZPG, I.SLO, 5],
    0x08: [A.SNG, I.PHP, 3], 0x09: [A.IMM, I.ORA, 2], 0x0A: [A.SNG, I.ASL, 2], 0x0B: [A.IMM, I.ANC, 2],
    0x0C: [A.ABS, I.NOP, 4], 0x0D: [A.ABS, I.ORA, 4], 0x0E: [A.ABS, I.ASL, 6], 0x0F: [A.ABS, I.SLO, 6],
    0x10: [A.BRA, I.BPL, 2], 0x11: [A.INY, I.ORA, 5], 0x12: [A.UNK, I.UNK, 2], 0x13: [A.INY, I.SLO, 8],
    0x14: [A.ZPX, I.NOP, 4], 0x15: [A.ZPX, I.ORA, 4], 0x16: [A.ZPX, I.ASL, 6], 0x17: [A.ZPX, I.SLO, 6],
    0x18: [A.SNG, I.CLC, 2], 0x19: [A.ABY, I.ORA, 4], 0x1A: [A.SNG, I.NOP, 2], 0x1B: [A.ABY, I.SLO, 7],
    0x1C: [A.ABX, I.NOP, 4], 0x1D: [A.ABX, I.ORA, 4], 0x1E: [A.ABX, I.ASL, 7], 0x1F: [A.ABX, I.SLO, 7],
    0x20: [A.ABS, I.JSR, 6], 0x21: [A.INX, I.AND, 6], 0x22: [A.UNK, I.UNK, 2], 0x23: [A.INX, I.RLA, 8],
    0x24: [A.ZPG, I.BIT, 3], 0x25: [A.ZPG, I.AND, 3], 0x26: [A.ZPG, I.ROL, 5], 0x27: [A.ZPG, I.RLA, 5],
    0x28: [A.SNG, I.PLP, 4], 0x29: [A.IMM, I.AND, 2], 0x2A: [A.SNG, I.ROL, 2], 0x2B: [A.IMM, I.ANC, 2],
    0x2C: [A.ABS, I.BIT, 4], 0x2D: [A.ABS, I.AND, 4], 0x2E: [A.ABS, I.ROL, 6], 0x2F: [A.ABS, I.RLA, 6],
    0x30: [A.BRA, I.BMI, 2], 0x31: [A.INY, I.AND, 5], 0x32: [A.UNK, I.UNK, 2], 0x33: [A.INY, I.RLA, 8],
    0x34: [A.ZPX, I.NOP, 4], 0x35: [A.ZPX, I.AND, 4], 0x36: [A.ZPX, I.ROL, 6], 0x37: [A.ZPX, I.RLA, 6],
    0x38: [A.SNG, I.SEC, 2], 0x39: [A.ABY, I.AND, 4], 0x3A: [A.SNG, I.NOP, 2], 0x3B: [A.ABY, I.RLA, 7],
    0x3C: [A.ABX, I.NOP, 4], 0x3D: [A.ABX, I.AND, 4], 0x3E: [A.ABX, I.ROL, 7], 0x3F: [A.ABX, I.RLA, 7],
    0x40: [A.SNG, I.RTI, 6], 0x41: [A.INX, I.EOR, 6], 0x42: [A.UNK, I.UNK, 2], 0x43: [A.INX, I.SRE, 8],
    0x44: [A.ZPG, I.NOP, 3], 0x45: [A.ZPG, I.EOR, 3], 0x46: [A.ZPG, I.LSR, 5], 0x47: [A.ZPG, I.SRE, 5],
    0x48: [A.SNG, I.PHA, 3], 0x49: [A.IMM, I.EOR, 2], 0x4A: [A.SNG, I.LSR, 2], 0x4B: [A.IMM, I.ASR, 2],
    0x4C: [A.ABS, I.JMP, 3], 0x4D: [A.ABS, I.EOR, 4], 0x4E: [A.ABS, I.LSR, 6], 0x4F: [A.ABS, I.SRE, 6],
    0x50: [A.BRA, I.BVC, 2], 0x51: [A.INY, I.EOR, 5], 0x52: [A.UNK, I.UNK, 2], 0x53: [A.INY, I.SRE, 8],
    0x54: [A.ZPX, I.NOP, 4], 0x55: [A.ZPX, I.EOR, 4], 0x56: [A.ZPX, I.LSR, 6], 0x57: [A.ZPX, I.SRE, 6],
    0x58: [A.SNG, I.CLI, 2], 0x59: [A.ABY, I.EOR, 4], 0x5A: [A.SNG, I.NOP, 2], 0x5B: [A.ABY, I.SRE, 7],
    0x5C: [A.ABX, I.NOP, 4], 0x5D: [A.ABX, I.EOR, 4], 0x5E: [A.ABX, I.LSR, 7], 0x5F: [A.ABX, I.SRE, 7],
    0x60: [A.SNG, I.RTS, 6], 0x61: [A.INX, I.ADC, 6], 0x62: [A.UNK, I.UNK, 2], 0x63: [A.INX, I.RRA, 8],
    0x64: [A.ZPG, I.NOP, 3], 0x65: [A.ZPG, I.ADC, 3], 0x66: [A.ZPG, I.ROR, 5], 0x67: [A.ZPG, I.RRA, 5],
    0x68: [A.SNG, I.PLA, 4], 0x69: [A.IMM, I.ADC, 2], 0x6A: [A.SNG, I.ROR, 2], 0x6B: [A.IMM, I.ARR, 2],
    0x6C: [A.IND, I.JMP, 5], 0x6D: [A.ABS, I.ADC, 4], 0x6E: [A.ABS, I.ROR, 6], 0x6F: [A.ABS, I.RRA, 6],
    0x70: [A.BRA, I.BVS, 2], 0x71: [A.INY, I.ADC, 5], 0x72: [A.UNK, I.UNK, 2], 0x73: [A.INY, I.RRA, 8],
    0x74: [A.ZPX, I.NOP, 4], 0x75: [A.ZPX, I.ADC, 4], 0x76: [A.ZPX, I.ROR, 6], 0x77: [A.ZPX, I.RRA, 6],
    0x78: [A.SNG, I.SEI, 2], 0x79: [A.ABY, I.ADC, 4], 0x7A: [A.SNG, I.NOP, 2], 0x7B: [A.ABY, I.RRA, 7],
    0x7C: [A.ABX, I.NOP, 4], 0x7D: [A.ABX, I.ADC, 4], 0x7E: [A.ABX, I.ROR, 7], 0x7F: [A.ABX, I.RRA, 7],
    0x80: [A.IMM, I.NOP, 2], 0x81: [A.INX, I.STA, 6], 0x82: [A.IMM, I.NOP, 2], 0x83: [A.INX, I.SAX, 6],
    0x84: [A.ZPG, I.STY, 3], 0x85: [A.ZPG, I.STA, 3], 0x86: [A.ZPG, I.STX, 3], 0x87: [A.ZPG, I.SAX, 3],
    0x88: [A.SNG, I.DEY, 2], 0x89: [A.IMM, I.NOP, 2], 0x8A: [A.SNG, I.TXA, 2], 0x8B: [A.IMM, I.XAA, 2],
    0x8C: [A.ABS, I.STY, 4], 0x8D: [A.ABS, I.STA, 4], 0x8E: [A.ABS, I.STX, 4], 0x8F: [A.ABS, I.SAX, 4],
    0x90: [A.BRA, I.BCC, 2], 0x91: [A.INY, I.STA, 6], 0x92: [A.UNK, I.UNK, 2], 0x93: [A.INY, I.AHX, 6],
    0x94: [A.ZPX, I.STY, 4], 0x95: [A.ZPX, I.STA, 4], 0x96: [A.ZPY, I.STX, 4], 0x97: [A.ZPY, I.SAX, 4],
    0x98: [A.SNG, I.TYA, 2], 0x99: [A.ABY, I.STA, 5], 0x9A: [A.SNG, I.TXS, 2], 0x9B: [A.ABY, I.TAS, 5],
    0x9C: [A.ABX, I.SHY, 5], 0x9D: [A.ABX, I.STA, 5], 0x9E: [A.ABY, I.SHX, 5], 0x9F: [A.ABY, I.AHX, 5],
    0xA0: [A.IMM, I.LDY, 2], 0xA1: [A.INX, I.LDA, 6], 0xA2: [A.IMM, I.LDX, 2], 0xA3: [A.INX, I.LAX, 6],
    0xA4: [A.ZPG, I.LDY, 3], 0xA5: [A.ZPG, I.LDA, 3], 0xA6: [A.ZPG, I.LDX, 3], 0xA7: [A.ZPG, I.LAX, 3],
    0xA8: [A.SNG, I.TAY, 2], 0xA9: [A.IMM, I.LDA, 2], 0xAA: [A.SNG, I.TAX, 2], 0xAB: [A.IMM, I.LAX, 2],
    0xAC: [A.ABS, I.LDY, 4], 0xAD: [A.ABS, I.LDA, 4], 0xAE: [A.ABS, I.LDX, 4], 0xAF: [A.ABS, I.LAX, 4],
    0xB0: [A.BRA, I.BCS, 2], 0xB1: [A.INY, I.LDA, 5], 0xB2: [A.UNK, I.UNK, 2], 0xB3: [A.INY, I.LAX, 5],
    0xB4: [A.ZPX, I.LDY, 4], 0xB5: [A.ZPX, I.LDA, 4], 0xB6: [A.ZPY, I.LDX, 4], 0xB7: [A.ZPY, I.LAX, 4],
    0xB8: [A.SNG, I.CLV, 2], 0xB9: [A.ABY, I.LDA, 4], 0xBA: [A.SNG, I.TSX, 2], 0xBB: [A.ABY, I.LAS, 4],
    0xBC: [A.ABX, I.LDY, 4], 0xBD: [A.ABX, I.LDA, 4], 0xBE: [A.ABY, I.LDX, 4], 0xBF: [A.ABY, I.LAX, 4],
    0xC0: [A.IMM, I.CPY, 2], 0xC1: [A.INX, I.CMP, 6], 0xC2: [A.IMM, I.NOP, 2], 0xC3: [A.INX, I.DCP, 8],
    0xC4: [A.ZPG, I.CPY, 3], 0xC5: [A.ZPG, I.CMP, 3], 0xC6: [A.ZPG, I.DEC, 5], 0xC7: [A.ZPG, I.DCP, 5],
    0xC8: [A.SNG, I.INY, 2], 0xC9: [A.IMM, I.CMP, 2], 0xCA: [A.SNG, I.DEX, 2], 0xCB: [A.IMM, I.AXS, 2],
    0xCC: [A.ABS, I.CPY, 4], 0xCD: [A.ABS, I.CMP, 4], 0xCE: [A.ABS, I.DEC, 6], 0xCF: [A.ABS, I.DCP, 6],
    0xD0: [A.BRA, I.BNE, 2], 0xD1: [A.INY, I.CMP, 5], 0xD2: [A.UNK, I.UNK, 2], 0xD3: [A.INY, I.DCP, 8],
    0xD4: [A.ZPX, I.NOP, 4], 0xD5: [A.ZPX, I.CMP, 4], 0xD6: [A.ZPX, I.DEC, 6], 0xD7: [A.ZPX, I.DCP, 6],
    0xD8: [A.SNG, I.CLD, 2], 0xD9: [A.ABY, I.CMP, 4], 0xDA: [A.SNG, I.NOP, 2], 0xDB: [A.ABY, I.DCP, 7],
    0xDC: [A.ABX, I.NOP, 4], 0xDD: [A.ABX, I.CMP, 4], 0xDE: [A.ABX, I.DEC, 7], 0xDF: [A.ABX, I.DCP, 7],
    0xE0: [A.IMM, I.CPX, 2], 0xE1: [A.INX, I.SBC, 6], 0xE2: [A.IMM, I.NOP, 2], 0xE3: [A.INX, I.ISB, 8],
    0xE4: [A.ZPG, I.CPX, 3], 0xE5: [A.ZPG, I.SBC, 3], 0xE6: [A.ZPG, I.INC, 5], 0xE7: [A.ZPG, I.ISB, 5],
    0xE8: [A.SNG, I.INX, 2], 0xE9: [A.IMM, I.SBC, 2], 0xEA: [A.SNG, I.NOP, 2], 0xEB: [A.IMM, I.SBC, 2],
    0xEC: [A.ABS, I.CPX, 4], 0xED: [A.ABS, I.SBC, 4], 0xEE: [A.ABS, I.INC, 6], 0xEF: [A.ABS, I.ISB, 6],
    0xF0: [A.BRA, I.BEQ, 2], 0xF1: [A.INY, I.SBC, 5], 0xF2: [A.UNK, I.UNK, 2], 0xF3: [A.INY, I.ISB, 8],
    0xF4: [A.ZPX, I.NOP, 4], 0xF5: [A.ZPX, I.SBC, 4], 0xF6: [A.ZPX, I.INC, 6], 0xF7: [A.ZPX, I.ISB, 6],
    0xF8: [A.SNG, I.SED, 2], 0xF9: [A.ABY, I.SBC, 4], 0xFA: [A.SNG, I.NOP, 2], 0xFB: [A.ABY, I.ISB, 7],
    0xFC: [A.ABX, I.NOP, 4], 0xFD: [A.ABX, I.SBC, 4], 0xFE: [A.ABX, I.INC, 7], 0xFF: [A.ABX, I.ISB, 7],
}

var NesLite = class {

    constructor() {
        this.OPTS = OPTS;
        this.ADDR = A;
        this.INST = I;
        this.FLAG = FLAG;
        this.RAM = new Uint8Array(256 * 256);
        this.reset();
    }

    /**
     * 初始化虚拟机
     */
    reset() {
        this.A = this.X = this.Y = 0;
        this.PC = 0x600;
        this.SP = 0xff;
        this.P = 0X00;
        this.CYC = 7;
        this.Message = "";
        this.Running = true;
    }

    /**
     * 加载一个NES文件中的数据
     */
    load(data) {
        // 验证文件头
        if (data[0] != 78 || data[1] != 69 || data[2] != 83)
            return false;
        // 读取元数据
        this.ROMFlags = data[6];
        this.Mapper = ((data[6] >> 4) | (data[7] & 0xF0));
        this.RAM = new Uint8Array(256 * 256);
        let prgLength = data[4] * 0x4000;
        let chrLength = data[5] * 0x2000;
        let prgStart = 0x10000 - prgLength;
        // 载入RAM
        for (let i = 0; i < prgLength; i++)
            this.RAM[prgStart + i] = data[0x10 + i];
        for (let i = 0; i < chrLength; i++)
            this.RAM[0x2000 + i] = data[0x10 + prgLength + i];
        // 重设
        this.reset();
        return true;
    }

    /**
     * 开始运行虚拟机
     */
    run() {
        while (true) {
            if (!this.Running) return;
            let pos = this.PC;
            let opt = OPTS[this.RAM[this.PC++]]
            let addr = opt[0](this);
            let length = this.PC - pos;
            if (this.log) this.log(this, pos, opt[1].name, length);
            this.CYC += opt[2];
            opt[1](this, addr)
        }
    }

    render() {

    }

    setA(value) {
        this.A = value & 0xff;
        this.setNZ(this.A);
    }

    setX(value) {
        this.X = value & 0xff;
        this.setNZ(this.X);
    }

    setY(value) {
        this.Y = value & 0xff;
        this.setNZ(this.Y);
    }

    setNZ(value) {
        if (value) this.P &= 0xfd;
        else this.P |= 0x02;
        if (value & 0x80) this.P |= 0x80;
        else this.P &= 0x7f;
    }

    setNZC(value) {
        this.setNZ(value);
        this.setFlag(FLAG.C, value >= 0);
    }

    setFlag(flag, value) {
        if (value == 0)
            this.P &= ~flag;
        else this.P |= flag;
    }

    getFlag(flag) {
        return (this.P & flag) != 0
    }

    push(value) {
        this.RAM[this.SP + 0x100] = value;
        if (--this.SP < 0) {
            this.Running = false;
            this.Message = "Stack Overflow";
        }
    }

    pop() {
        if (++this.SP >= 0x100) {
            this.Running = false;
            this.Message = "Stack Empty";
        }
        return this.RAM[this.SP + 0x100];
    }
}

if (module)
    module.exports = NesLite;
