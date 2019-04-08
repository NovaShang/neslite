
// P位的各个Flag
const FLAG = {
    N: 0x80, V: 0x40, B: 0x10, R: 0x20,
    D: 0x08, I: 0x04, Z: 0x02, C: 0x01
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
    }
}

// 寻址方式
const ADDR = {
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
    0x69: [INST.ADC, ADDR.IMM, 2], 0x65: [INST.ADC, ADDR.ZPG, 3], 0x75: [INST.ADC, ADDR.ZPX, 4],
    0x6D: [INST.ADC, ADDR.ABS, 4], 0x7D: [INST.ADC, ADDR.ABX, 4], 0x79: [INST.ADC, ADDR.ABY, 4],
    0x61: [INST.ADC, ADDR.INX, 6], 0x71: [INST.ADC, ADDR.INY, 5], 0x72: [INST.ADC, ADDR.IND, 5],
    0x29: [INST.AND, ADDR.IMM, 2], 0x25: [INST.AND, ADDR.ZPG, 3], 0x35: [INST.AND, ADDR.ZPX, 4],
    0x2D: [INST.AND, ADDR.ABS, 4], 0x3D: [INST.AND, ADDR.ABX, 4], 0x39: [INST.AND, ADDR.ABY, 4],
    0x21: [INST.AND, ADDR.INX, 6], 0x31: [INST.AND, ADDR.INY, 5], 0x32: [INST.AND, ADDR.IND, 5],
    0x0A: [INST.ASL, ADDR.SNG, 2], 0x06: [INST.ASL, ADDR.ZPG, 5], 0x16: [INST.ASL, ADDR.ZPX, 6],
    0x0E: [INST.ASL, ADDR.ABS, 6], 0x1E: [INST.ASL, ADDR.ABX, 7], 0x90: [INST.BCC, ADDR.BRA, 2],
    0xB0: [INST.BCS, ADDR.BRA, 2], 0xF0: [INST.BEQ, ADDR.BRA, 2], 0x89: [INST.BIT, ADDR.IMM, 2],
    0x24: [INST.BIT, ADDR.ZPG, 3], 0x34: [INST.NOP, ADDR.ZPX, 4], 0x2C: [INST.BIT, ADDR.ABS, 4],
    0x3C: [INST.NOP, ADDR.ABX, 4], 0x30: [INST.BMI, ADDR.BRA, 2], 0xD0: [INST.BNE, ADDR.BRA, 2],
    0x10: [INST.BPL, ADDR.BRA, 2], 0x80: [INST.NOP, ADDR.BRA, 3], 0x00: [INST.BRK, ADDR.SNG, 7],
    0x50: [INST.BVC, ADDR.BRA, 2], 0x70: [INST.BVS, ADDR.BRA, 2], 0x18: [INST.CLC, ADDR.SNG, 2],
    0xD8: [INST.CLD, ADDR.SNG, 2], 0x58: [INST.CLI, ADDR.SNG, 2], 0xB8: [INST.CLV, ADDR.SNG, 2],
    0xC9: [INST.CMP, ADDR.IMM, 2], 0xC5: [INST.CMP, ADDR.ZPG, 3], 0xD5: [INST.CMP, ADDR.ZPX, 4],
    0xCD: [INST.CMP, ADDR.ABS, 4], 0xDD: [INST.CMP, ADDR.ABX, 4], 0xD9: [INST.CMP, ADDR.ABY, 4],
    0xC1: [INST.CMP, ADDR.INX, 6], 0xD1: [INST.CMP, ADDR.INY, 5], 0xD2: [INST.CMP, ADDR.IND, 5],
    0xE0: [INST.CPX, ADDR.IMM, 2], 0xE4: [INST.CPX, ADDR.ZPG, 3], 0xEC: [INST.CPX, ADDR.ABS, 4],
    0xC0: [INST.CPY, ADDR.IMM, 2], 0xC4: [INST.CPY, ADDR.ZPG, 3], 0xCC: [INST.CPY, ADDR.ABS, 4],
    0x3A: [INST.NOP, ADDR.SNG, 2], 0xC6: [INST.DEC, ADDR.ZPG, 5], 0xD6: [INST.DEC, ADDR.ZPX, 6],
    0xCE: [INST.DEC, ADDR.ABS, 6], 0xDE: [INST.DEC, ADDR.ABX, 7], 0xCA: [INST.DEX, ADDR.SNG, 2],
    0x88: [INST.DEY, ADDR.SNG, 2], 0x49: [INST.EOR, ADDR.IMM, 2], 0x45: [INST.EOR, ADDR.ZPG, 3],
    0x55: [INST.EOR, ADDR.ZPX, 4], 0x4D: [INST.EOR, ADDR.ABS, 4], 0x5D: [INST.EOR, ADDR.ABX, 4],
    0x59: [INST.EOR, ADDR.ABY, 4], 0x41: [INST.EOR, ADDR.INX, 6], 0x51: [INST.EOR, ADDR.INY, 5],
    0x52: [INST.EOR, ADDR.IND, 5], 0x1A: [INST.NOP, ADDR.SNG, 2], 0xE6: [INST.INC, ADDR.ZPG, 5],
    0xF6: [INST.INC, ADDR.ZPX, 6], 0xEE: [INST.INC, ADDR.ABS, 6], 0xFE: [INST.INC, ADDR.ABX, 7],
    0xE8: [INST.INX, ADDR.SNG, 2], 0xC8: [INST.INY, ADDR.SNG, 2], 0x4C: [INST.JMP, ADDR.ABS, 3],
    0x6C: [INST.JMP, ADDR.IND, 5], 0x7C: [INST.NOP, ADDR.ABX, 6], 0x20: [INST.JSR, ADDR.ABS, 6],
    0xA9: [INST.LDA, ADDR.IMM, 2], 0xA5: [INST.LDA, ADDR.ZPG, 3], 0xB5: [INST.LDA, ADDR.ZPX, 4],
    0xAD: [INST.LDA, ADDR.ABS, 4], 0xBD: [INST.LDA, ADDR.ABX, 4], 0xB9: [INST.LDA, ADDR.ABY, 4],
    0xA1: [INST.LDA, ADDR.INX, 6], 0xB1: [INST.LDA, ADDR.INY, 5], 0xB2: [INST.LDA, ADDR.IND, 5],
    0xA2: [INST.LDX, ADDR.IMM, 2], 0xA6: [INST.LDX, ADDR.ZPG, 3], 0xB6: [INST.LDX, ADDR.ZPY, 4],
    0xAE: [INST.LDX, ADDR.ABS, 4], 0xBE: [INST.LDX, ADDR.ABY, 4], 0xA0: [INST.LDY, ADDR.IMM, 2],
    0xA4: [INST.LDY, ADDR.ZPG, 3], 0xB4: [INST.LDY, ADDR.ZPX, 4], 0xAC: [INST.LDY, ADDR.ABS, 4],
    0xBC: [INST.LDY, ADDR.ABX, 4], 0x4A: [INST.LSR, ADDR.SNG, 2], 0x46: [INST.LSR, ADDR.ZPG, 5],
    0x56: [INST.LSR, ADDR.ZPX, 6], 0x4E: [INST.LSR, ADDR.ABS, 6], 0x5E: [INST.LSR, ADDR.ABX, 7],
    0xEA: [INST.NOP, ADDR.SNG, 2], 0x09: [INST.ORA, ADDR.IMM, 2], 0x05: [INST.ORA, ADDR.ZPG, 3],
    0x15: [INST.ORA, ADDR.ZPX, 4], 0x0D: [INST.ORA, ADDR.ABS, 4], 0x1D: [INST.ORA, ADDR.ABX, 4],
    0x19: [INST.ORA, ADDR.ABY, 4], 0x01: [INST.ORA, ADDR.INX, 6], 0x11: [INST.ORA, ADDR.INY, 5],
    0x12: [INST.ORA, ADDR.IND, 5], 0x48: [INST.PHA, ADDR.SNG, 3], 0x08: [INST.PHP, ADDR.SNG, 3],
    0xDA: [INST.NOP, ADDR.SNG, 3], 0x5A: [INST.NOP, ADDR.SNG, 3], 0x68: [INST.PLA, ADDR.SNG, 4],
    0x28: [INST.PLP, ADDR.SNG, 4], 0xFA: [INST.NOP, ADDR.SNG, 4], 0x7A: [INST.NOP, ADDR.SNG, 4],
    0x2A: [INST.ROL, ADDR.SNG, 2], 0x26: [INST.ROL, ADDR.ZPG, 5], 0x36: [INST.ROL, ADDR.ZPX, 6],
    0x2E: [INST.ROL, ADDR.ABS, 6], 0x3E: [INST.ROL, ADDR.ABX, 7], 0x6A: [INST.ROR, ADDR.SNG, 2],
    0x66: [INST.ROR, ADDR.ZPG, 5], 0x76: [INST.ROR, ADDR.ZPX, 6], 0x6E: [INST.ROR, ADDR.ABS, 6],
    0x7E: [INST.ROR, ADDR.ABX, 7], 0x40: [INST.RTI, ADDR.SNG, 6], 0x60: [INST.RTS, ADDR.SNG, 6],
    0xE9: [INST.SBC, ADDR.IMM, 2], 0xE5: [INST.SBC, ADDR.ZPG, 3], 0xF5: [INST.SBC, ADDR.ZPX, 4],
    0xED: [INST.SBC, ADDR.ABS, 4], 0xFD: [INST.SBC, ADDR.ABX, 4], 0xF9: [INST.SBC, ADDR.ABY, 4],
    0xE1: [INST.SBC, ADDR.INX, 6], 0xF1: [INST.SBC, ADDR.INY, 5], 0xF2: [INST.SBC, ADDR.IND, 5],
    0x38: [INST.SEC, ADDR.SNG, 2], 0xF8: [INST.SED, ADDR.SNG, 2], 0x78: [INST.SEI, ADDR.SNG, 2],
    0x85: [INST.STA, ADDR.ZPG, 3], 0x95: [INST.STA, ADDR.ZPX, 4], 0x8D: [INST.STA, ADDR.ABS, 4],
    0x9D: [INST.STA, ADDR.ABX, 5], 0x99: [INST.STA, ADDR.ABY, 5], 0x81: [INST.STA, ADDR.INX, 6],
    0x91: [INST.STA, ADDR.INY, 6], 0x92: [INST.STA, ADDR.IND, 5], 0x86: [INST.STX, ADDR.ZPG, 3],
    0x96: [INST.STX, ADDR.ZPY, 4], 0x8E: [INST.STX, ADDR.ABS, 4], 0x84: [INST.STY, ADDR.ZPG, 3],
    0x94: [INST.STY, ADDR.ZPX, 4], 0x8C: [INST.STY, ADDR.ABS, 4], 0x64: [INST.NOP, ADDR.ZPG, 3],
    0x74: [INST.NOP, ADDR.ZPX, 4], 0x9C: [INST.STZ, ADDR.ABS, 4], 0x9E: [INST.STZ, ADDR.ABX, 5],
    0xAA: [INST.TAX, ADDR.SNG, 2], 0xA8: [INST.TAY, ADDR.SNG, 2], 0x14: [INST.NOP, ADDR.ZPG, 5],
    0x1C: [INST.NOP, ADDR.ABS, 6], 0x04: [INST.NOP, ADDR.ZPG, 5], 0x0C: [INST.NOP, ADDR.ABS, 6],
    0xBA: [INST.TSX, ADDR.SNG, 2], 0x8A: [INST.TXA, ADDR.SNG, 2], 0x9A: [INST.TXS, ADDR.SNG, 2],
    0x98: [INST.TYA, ADDR.SNG, 2], 0x44: [INST.NOP, ADDR.ZPG, 2], 0x54: [INST.NOP, ADDR.ZPX, 3],
    0xD4: [INST.NOP, ADDR.ZPX, 3], 0xF4: [INST.NOP, ADDR.ZPX, 3], 0x5C: [INST.NOP, ADDR.ABX, 3],
    0xDC: [INST.NOP, ADDR.ABX, 3], 0xFC: [INST.NOP, ADDR.ABX, 3]
}

module.exports = class NesLite {

    constructor() {
        this.OPTS = OPTS;
        this.ADDR = ADDR;
        this.INST = INST;
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
        this.SP = 0xfd;
        this.P = 0X24;
        this.CYC = 7;
        this.Message = "";
        this.Running = true;
    }

    /**
     * 加载一个NES文件中的数据
     * @param {Uint8Array} data 
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

    run() {
        if (!this.Running) return;
        let pos = this.PC;
        let opt = OPTS[this.RAM[this.PC++]];
        if (!opt)
            throw ("找不到操作码");
        let addr = opt[1](this);
        let length = this.PC - pos;
        if (this.log) this.log(this, pos, opt[0].name, opt[1].name, addr, length);
        this.CYC += opt[2];
        opt[0](this, addr)
        return this.run();
    }


    pause() {
        this.Running = false;
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
