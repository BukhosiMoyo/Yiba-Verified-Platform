import { authenticator } from "otplib";
import QRCode from "qrcode";

const APP_NAME = "Yiba Verified";

export function generateTwoFactorSecret(accountName: string) {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(accountName, APP_NAME, secret);
    return { secret, otpauth };
}

export async function generateQRCode(otpauth: string) {
    return await QRCode.toDataURL(otpauth);
}

export function verifyTwoFactorToken(token: string, secret: string) {
    try {
        return authenticator.verify({ token, secret });
    } catch (err) {
        return false;
    }
}
