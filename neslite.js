
// P位的各个Flag
const FLAG = {
    N: 0x80, V: 0x40, B: 0x10, D: 0x08,
    I: 0x04, Z: 0x02, C: 0x01
}

// 指令集
const INST = {

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
    PHP: (s, a) => s.push(s.P),
    PLA: (s, a) => s.setA(s.pop()),
    PLX: (s, a) => s.setX(s.pop()),
    PLY: (s, a) => s.setY(s.pop()),
    PLP: (s, a) => s.setP(s.pop()),
    TSX: (s, a) => s.setX(s.SP),
    TXS: (s, a) => s.SP = s.X,

    // 递增与递减
    INA: (s, a) => s.setA(s.A + 1),
    INX: (s, a) => s.setX(s.X + 1),
    INY: (s, a) => s.setY(s.Y + 1),
    DEA: (s, a) => s.setA(s.A - 1),
    DEX: (s, a) => s.setX(s.X - 1),
    DEY: (s, a) => s.setY(s.Y - 1),
    INC: (s, a) => s.setValueFlags(++s.RAM[a]),
    DEC: (s, a) => s.setValueFlags(--s.RAM[a]),

    // 移动位置操作
    ASL: (s, a) => {
        let value = s.RAM[a];
        s.setC(value, true);
        s.RAM[a] = (value << 1) & 0xff;
        s.setValueFlags(s.RAM[a]);
    },
    LSR: (s, a) => {
        let value = s.RAM[a];
        s.setC(value, false);
        s.RAM[a] = value >> 1;
        s.setValueFlags(s.RAM[a]);
    },
    ROL: (s, a) => {
        let value = s.RAM[a];
        s.setC(value, true);
        s.RAM[a] = ((value << 1) | s.getFlag(FLAG.C)) & 0xff;
        s.setValueFlags(s.RAM[a]);
    },
    ROR: (s, a) => {
        let value = s.RAM[a];
        s.setC(value, false);
        s.RAM[a] = (value >> 1) | (s.getFlag(FLAG.C) << 7);
        s.setValueFlags(s.RAM[a]);
    },

    // 逻辑操作
    AND: (s, a) => s.setA(s.A & s.RAM[a]),
    ORA: (s, a) => s.setA(s.A | s.RAM[a]),
    EOR: (s, a) => s.setA(s.A ^ s.RAM[a]),
    CMP: (s, a) => s.setValueFlags(s.A - s.RAM[a], true),
    CPX: (s, a) => s.setValueFlags(s.X - s.RAM[a], true),
    CPY: (s, a) => s.setValueFlags(s.Y - s.RAM[a], true),
    BIT: (s, a) => {
        let t = s.RAM[a];
        s.setP(t >> 7 & 1, t >> 6 & 1, null, null, null, s.A & t ? 0 : 1, null)
    },

    // 算术操作
    ADC: (s, a) => {
        let m = s.RAM[a];
        let t = s.A + m + s.getFlag(FLAG.C);
        s.setFlag(FLAG.C, (t >> 8) > 0);
        s.setFlag(FLAG.V, ((~(s.A ^ m)) & (s.A ^ t) & 0x80) != 0)
        s.setA(t & 0xFF);
    },
    SBC: (s, a) => {
        let m = s.RAM[a];
        let t = s.A - m - (1 - s.getFlag(FLAG.C));
        s.setFlag(FLAG.C, !(t >> 8));
        s.setFlag(FLAG.V, ((~(s.A ^ m)) & (s.A ^ t) & 0x80) == 0)
        s.setA(t & 0xFF);
    },

    // 流程控制
    JMP: (s, a) => s.PC = a,
    RTS: (s, a) => s.PC = s.pop() | (s.pop() << 8),
    BRA: (s, a) => s.PC += a,
    BEQ: (s, a) => s.getFlag(FLAG.Z) ? PC += a : 0,
    BNE: (s, a) => s.getFlag(FLAG.Z) ? 0 : PC += a,
    BCC: (s, a) => s.getFlag(FLAG.C) ? PC += a : 0,
    BCS: (s, a) => s.getFlag(FLAG.C) ? 0 : PC += a,
    BVC: (s, a) => s.getFlag(FLAG.V) ? PC += a : 0,
    BVS: (s, a) => s.getFlag(FLAG.V) ? 0 : PC += a,
    BMI: (s, a) => s.getFlag(FLAG.N) ? PC += a : 0,
    BPL: (s, a) => s.getFlag(FLAG.N) ? 0 : PC += a,
    JSR: (s, a) => {
        s.PC--;
        s.push(s.PC >> 8);
        s.push(s.PC & 0xFF);
        s.PC = a;
    },
    RTI: (s, a) => {
        s.P = s.pop();
        s.setFlag(FLAG.B, 0);
        s.PC = s.pop() | (s.pop() >> 8);
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
        s.push(s.P);
        s.setFlag(FLAG.I, 1);
        s.PC = s.RAM[0xFFFE] | (s.RAM[0xFFFF] << 8);
    }
}

// 寻址方式
const ADDR = {
    IMM: s => s.PC++,
    ZPG: s => s.RAM[s.PC++],
    ZPX: s => (s.RAM[s.PC++] + s.X) & 0xFF,
    ZPY: s => (s.RAM[s.PC++] + s.Y) & 0xFF,
    ABS: s => s.RAM[s.PC++] | (s.RAM[s.PC++] << 8),
    ABX: s => (s.RAM[s.PC++] | (s.RAM[s.PC++] << 8)) + s.X,
    ABY: s => (s.RAM[s.PC++] | (s.RAM[s.PC++] << 8)) + s.Y,
    IND: s => {
        let t1 = s.RAM[s.PC++] | (s.RAM[s.PC++] << 8);
        let t2 = (t1 & 0xFF00) | ((t1 + 1) & 0x00FF);// 复原6052的bug
        return s.RAM[t1] | (s.RAM[t2] << 8);
    },
    INX: s => {
        let t = s.RAM[s.PC++] + s.X;
        return s.RAM[t] | (s.RAM[t + 1] << 8);
    },
    INY: s => {
        let t = s.RAM[s.PC++] + s.Y;
        return s.RAM[t] | (s.RAM[t + 1] << 8);
    },
    SNG: s => 0,
    BRA: s => {
        let offset = s.RAM[s.PC++];
        offset = (offset > 0x7f) ? - (0x100 - offset) : offset;
        if (s.getFlag(FLAG.N)) offset = -offset;
        return offset;
    }
}

// 操作码 - 汇编指令 - 寻址方式的对应关系
const OPTS = {
    0x69: [INST.ADC, ADDR.IMM], 0x65: [INST.ADC, ADDR.ZPG], 0x75: [INST.ADC, ADDR.ZPX],
    0x6D: [INST.ADC, ADDR.ABS], 0x7D: [INST.ADC, ADDR.ABX], 0x79: [INST.ADC, ADDR.ABY],
    0x61: [INST.ADC, ADDR.INX], 0x71: [INST.ADC, ADDR.INY], 0xEA: [INST.NOP, ADDR.SNG],
    0x29: [INST.AND, ADDR.IMM], 0x25: [INST.AND, ADDR.ZPG], 0x35: [INST.AND, ADDR.ZPX],
    0x2D: [INST.AND, ADDR.ABS], 0x3D: [INST.AND, ADDR.ABX], 0x39: [INST.AND, ADDR.ABY],
    0x21: [INST.AND, ADDR.INX], 0x31: [INST.AND, ADDR.INY], 0x91: [INST.STA, ADDR.INY],
    0x06: [INST.ASL, ADDR.ZPG], 0x16: [INST.ASL, ADDR.ZPX], 0x0E: [INST.ASL, ADDR.ABS],
    0x1E: [INST.ASL, ADDR.ABX], 0x0A: [INST.ASL, ADDR.SNG], 0xA1: [INST.LDA, ADDR.INX],
    0x10: [INST.BPL, ADDR.BRA], 0x30: [INST.BMI, ADDR.BRA], 0x50: [INST.BVC, ADDR.BRA],
    0x70: [INST.BVS, ADDR.BRA], 0x90: [INST.BCC, ADDR.BRA], 0xB0: [INST.BCS, ADDR.BRA],
    0xD0: [INST.BNE, ADDR.BRA], 0xF0: [INST.BEQ, ADDR.BRA], 0x00: [INST.BRK, ADDR.SNG],
    0xC9: [INST.CMP, ADDR.IMM], 0xC5: [INST.CMP, ADDR.ZPG], 0xD5: [INST.CMP, ADDR.ZPX],
    0xCD: [INST.CMP, ADDR.ABS], 0xDD: [INST.CMP, ADDR.ABX], 0xD9: [INST.CMP, ADDR.ABY],
    0xC1: [INST.CMP, ADDR.INX], 0xD1: [INST.CMP, ADDR.INY], 0xB1: [INST.LDA, ADDR.INY],
    0xE0: [INST.CPX, ADDR.IMM], 0xE4: [INST.CPX, ADDR.ZPG], 0xEC: [INST.CPX, ADDR.ABS],
    0xC0: [INST.CPY, ADDR.IMM], 0xC4: [INST.CPY, ADDR.ZPG], 0xCC: [INST.CPY, ADDR.ABS],
    0xC6: [INST.DEC, ADDR.ZPG], 0xD6: [INST.DEC, ADDR.ZPX], 0xCE: [INST.DEC, ADDR.ABS],
    0xDE: [INST.DEC, ADDR.ABX], 0x24: [INST.BIT, ADDR.ZPG], 0x2C: [INST.BIT, ADDR.ABS],
    0x49: [INST.EOR, ADDR.IMM], 0x45: [INST.EOR, ADDR.ZPG], 0x55: [INST.EOR, ADDR.ZPX],
    0x4D: [INST.EOR, ADDR.ABS], 0x5D: [INST.EOR, ADDR.ABX], 0x59: [INST.EOR, ADDR.ABY],
    0x41: [INST.EOR, ADDR.INX], 0x51: [INST.EOR, ADDR.INY], 0x18: [INST.CLC, ADDR.SNG],
    0x38: [INST.SEC, ADDR.SNG], 0x58: [INST.CLI, ADDR.SNG], 0x78: [INST.SEI, ADDR.SNG],
    0xD8: [INST.CLD, ADDR.SNG], 0xF8: [INST.SED, ADDR.SNG], 0xB8: [INST.CLV, ADDR.SNG],
    0xE6: [INST.INC, ADDR.ZPG], 0xF6: [INST.INC, ADDR.ZPX], 0xEE: [INST.INC, ADDR.ABS],
    0xFE: [INST.INC, ADDR.ABX], 0x01: [INST.ORA, ADDR.INX], 0x11: [INST.ORA, ADDR.INY],
    0x4C: [INST.JMP, ADDR.ABS], 0x6C: [INST.JMP, ADDR.IND], 0x20: [INST.JSR, ADDR.ABS],
    0xA9: [INST.LDA, ADDR.IMM], 0xA5: [INST.LDA, ADDR.ZPG], 0xB5: [INST.LDA, ADDR.ZPX],
    0xAD: [INST.LDA, ADDR.ABS], 0xBD: [INST.LDA, ADDR.ABX], 0xB9: [INST.LDA, ADDR.ABY],
    0xA2: [INST.LDX, ADDR.IMM], 0xA6: [INST.LDX, ADDR.ZPG], 0xB6: [INST.LDX, ADDR.ZPY],
    0xAE: [INST.LDX, ADDR.ABS], 0xBE: [INST.LDX, ADDR.ABY], 0xBC: [INST.LDY, ADDR.ABX],
    0xA0: [INST.LDY, ADDR.IMM], 0xA4: [INST.LDY, ADDR.ZPG], 0xB4: [INST.LDY, ADDR.ZPX],
    0x46: [INST.LSR, ADDR.ZPG], 0x56: [INST.LSR, ADDR.ZPX], 0x4E: [INST.LSR, ADDR.ABS],
    0x5E: [INST.LSR, ADDR.ABX], 0x4A: [INST.LSR, ADDR.SNG], 0xAC: [INST.LDY, ADDR.ABS],
    0x09: [INST.ORA, ADDR.IMM], 0x05: [INST.ORA, ADDR.ZPG], 0x15: [INST.ORA, ADDR.ZPX],
    0x0D: [INST.ORA, ADDR.ABS], 0x1D: [INST.ORA, ADDR.ABX], 0x19: [INST.ORA, ADDR.ABY],
    0xAA: [INST.TAX, ADDR.SNG], 0x8A: [INST.TXA, ADDR.SNG], 0xCA: [INST.DEX, ADDR.SNG],
    0xE8: [INST.INX, ADDR.SNG], 0xA8: [INST.TAY, ADDR.SNG], 0x98: [INST.TYA, ADDR.SNG],
    0x88: [INST.DEY, ADDR.SNG], 0xC8: [INST.INY, ADDR.SNG], 0x60: [INST.RTS, ADDR.SNG],
    0x26: [INST.ROL, ADDR.ZPG], 0x36: [INST.ROL, ADDR.ZPX], 0x2E: [INST.ROL, ADDR.ABS],
    0x3E: [INST.ROL, ADDR.ABX], 0x2A: [INST.ROL, ADDR.SNG], 0x40: [INST.RTI, ADDR.SNG],
    0xE9: [INST.SBC, ADDR.IMM], 0xE5: [INST.SBC, ADDR.ZPG], 0xF5: [INST.SBC, ADDR.ZPX],
    0xED: [INST.SBC, ADDR.ABS], 0xFD: [INST.SBC, ADDR.ABX], 0xF9: [INST.SBC, ADDR.ABY],
    0xE1: [INST.SBC, ADDR.INX], 0xF1: [INST.SBC, ADDR.INY], 0x42: [INST.WDM, ADDR.IMM],
    0x85: [INST.STA, ADDR.ZPG], 0x95: [INST.STA, ADDR.ZPX], 0x8D: [INST.STA, ADDR.ABS],
    0x9D: [INST.STA, ADDR.ABX], 0x99: [INST.STA, ADDR.ABY], 0x81: [INST.STA, ADDR.INX],
    0x9A: [INST.TXS, ADDR.SNG], 0xBA: [INST.TSX, ADDR.SNG], 0x48: [INST.PHA, ADDR.SNG],
    0x68: [INST.PLA, ADDR.SNG], 0x08: [INST.PHP, ADDR.SNG], 0x28: [INST.PLP, ADDR.SNG],
    0x86: [INST.STX, ADDR.ZPG], 0x96: [INST.STX, ADDR.ZPY], 0x8E: [INST.STX, ADDR.ABS],
    0x84: [INST.STY, ADDR.ZPG], 0x94: [INST.STY, ADDR.ZPX], 0x8C: [INST.STY, ADDR.ABS],
    0x66: [INST.ROR, ADDR.ZPG], 0x76: [INST.ROR, ADDR.ZPX], 0x6E: [INST.ROR, ADDR.ABS],
    0x7E: [INST.ROR, ADDR.ABX], 0x6A: [INST.ROR, ADDR.SNG],

}

module.exports = class NesLite {

    constructor() {
        this.A = this.X = this.Z = 0;
        this.PC = 0x600;
        this.SP = 0xff;
        this.P = 0;
        this.RAM = new Uint8Array(256 * 256);
        this.OPTS = OPTS;
        this.ADDR = ADDR;
        this.INST = INST;
        this.FLAG = FLAG;
    }

    start() {
        while (true) {
            let opt = OPTS[this.RAM[this.PC]];
            opt[0](this, opt[1](this));
        }
    }

    setA(value) {
        this.A = value;
        this.setValueFlags(value);
    }

    setX(value) {
        this.X = value;
        this.setValueFlags(value);
    }

    setY(value) {
        this.Y = value;
        this.setValueFlags(value);
    }

    setValueFlags(value) {
        if (value) this.P &= 0xfd;
        else this.P |= 0x02;
        if (value & 0x80) this.P |= 0x80;
        else this.P &= 0x7f;
    }

    setFlag(flag, value) {
        if (value == 1)
            this.P |= flag;
        else if (value == 0)
            this.P &= ~flag;
    }

    getFlag(flag) {
        return (this.P & flag) != 0
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
