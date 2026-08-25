/** Alias phổ biến → slug path trên qr.xgate.vn (lowercase) */
const BANK_CODE_ALIASES: Record<string, string> = {
    VCB: "vietcombank",
    VIETCOMBANK: "vietcombank",
    TCB: "techcombank",
    TECHCOMBANK: "techcombank",
    MB: "mbbank",
    MBB: "mbbank",
    MBBANK: "mbbank",
    BIDV: "bidv",
    ACB: "acb",
    VPB: "vpbank",
    VPBANK: "vpbank",
    TPB: "tpbank",
    TPBANK: "tpbank",
    AGR: "agribank",
    AGRIBANK: "agribank",
    STB: "sacombank",
    SACOMBANK: "sacombank",
    VIETINBANK: "vietinbank",
    CTG: "vietinbank",
    HDB: "hdbank",
    HDBANK: "hdbank",
    OCB: "ocb",
    VIB: "vib",
    SHB: "shb",
    MSB: "msb",
    SCB: "scb",
    EXIMBANK: "eximbank",
    SEABANK: "seabank",
    LPB: "lpbank",
    LPBANK: "lpbank",
};

/** Chuẩn hóa mã ngân hàng cho URL VietQR xGate */
export const normalizeBankCode = (bankCode: string): string => {
    const trimmed = bankCode.trim();
    const upper = trimmed.toUpperCase();
    const alias = BANK_CODE_ALIASES[upper];

    if (alias) return alias;

    return trimmed.toLowerCase();
};
