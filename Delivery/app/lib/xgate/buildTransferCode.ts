/** Mã nội dung CK cho checkout mới (PendingCheckout) */
export const buildPendingTransferCode = (pendingCheckoutId: string): string =>
    `DH${pendingCheckoutId.slice(-8).toUpperCase()}`;

/** Mã nội dung CK khi đổi COD → Online (Order đã tồn tại) */
export const buildOrderTransferCode = (orderId: string): string =>
    `CO${orderId.slice(-8).toUpperCase()}`;

const TRANSFER_CODE_REGEX = /\b(DH[A-F0-9]{8}|CO[A-F0-9]{8})\b/i;

/** Trích mã CK từ nội dung giao dịch ngân hàng */
export const extractTransferCode = (content: string): string | null => {
    const match = content.match(TRANSFER_CODE_REGEX);
    return match ? match[1].toUpperCase() : null;
};
