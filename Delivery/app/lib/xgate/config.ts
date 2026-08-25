export type XGateConfig = {
    apiKey?: string;
    webhookSecret: string;
    bankCode: string;
    accountNo: string;
    accountName: string;
    template: string;
};

export const getXGateConfig = (): XGateConfig => ({
    apiKey: process.env.XGATE_QR_API_KEY,
    webhookSecret: process.env.XGATE_WEBHOOK_SECRET ?? "",
    bankCode: process.env.XGATE_BANK_CODE ?? "vietcombank",
    accountNo: process.env.XGATE_ACCOUNT_NO ?? "",
    accountName: process.env.XGATE_ACCOUNT_NAME ?? "",
    template: process.env.XGATE_QR_TEMPLATE ?? "compact",
});

export const CHECKOUT_EXPIRES_MINUTES = 5;
