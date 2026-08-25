import { getXGateConfig } from "./config";
import { normalizeBankCode } from "./normalizeBankCode";

type GenerateVietQrInput = {
    amount: number;
    description: string;
};

/** Tạo URL ảnh VietQR qua Quick Link (qr.xgate.vn) */
export const buildVietQrUrl = ({ amount, description }: GenerateVietQrInput): string => {
    const { bankCode, accountNo, accountName, template } = getXGateConfig();
    const normalizedBankCode = normalizeBankCode(bankCode);

    const params = new URLSearchParams({
        amount: String(Math.round(amount)),
        desc: description,
        name: accountName,
    });

    return `https://qr.xgate.vn/img/${normalizedBankCode}/${accountNo}/${template}.png?${params.toString()}`;
};
