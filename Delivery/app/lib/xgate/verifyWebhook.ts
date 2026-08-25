import crypto from "crypto";
import { getXGateConfig } from "./config";

const safeEqual = (a: string, b: string): boolean => {
    try {
        const aBuffer = Buffer.from(a, "utf8");
        const bBuffer = Buffer.from(b, "utf8");

        if (aBuffer.length !== bBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(aBuffer, bBuffer);
    } catch {
        return false;
    }
};

const hmacHex = (secret: string, data: string): string =>
    crypto.createHmac("sha256", secret).update(data).digest("hex");

/**
 * xGate có thể gửi chữ ký qua:
 * - Header: X-Webhook-Signature
 * - Body field: checksum (HMAC-SHA256 của raw body hoặc body không có checksum)
 */
export const verifyXGateWebhook = (
    rawBody: string,
    headerSignature: string | null,
    bodyChecksum?: string | null
): boolean => {
    const { webhookSecret } = getXGateConfig();

    if (!webhookSecret) {
        return false;
    }

    const expectedFromRaw = hmacHex(webhookSecret, rawBody);

    if (headerSignature && safeEqual(expectedFromRaw, headerSignature)) {
        return true;
    }

    if (bodyChecksum && safeEqual(expectedFromRaw, bodyChecksum)) {
        return true;
    }

    try {
        const parsed = JSON.parse(rawBody) as { checksum?: string };
        const checksum = bodyChecksum ?? parsed.checksum;

        if (!checksum) {
            return false;
        }

        if (safeEqual(expectedFromRaw, checksum)) {
            return true;
        }

        const { checksum: _removed, ...rest } = parsed;
        const bodyWithoutChecksum = JSON.stringify(rest);
        const expectedWithoutChecksum = hmacHex(webhookSecret, bodyWithoutChecksum);

        return safeEqual(expectedWithoutChecksum, checksum);
    } catch {
        return false;
    }
};
