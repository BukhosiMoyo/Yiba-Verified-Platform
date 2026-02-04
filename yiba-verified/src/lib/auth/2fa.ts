import { TOTP } from "otplib";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import QRCode from "qrcode";

const totp = new TOTP({
    algorithm: "sha1",
    digits: 6,
    period: 30,
    crypto: new NobleCryptoPlugin(),
    base32: new ScureBase32Plugin(),
});

const APP_NAME = "Yiba Verified";

export function generateTwoFactorSecret(accountName: string) {
    const secret = totp.generateSecret();
    // totp.toURI({ label, issuer, secret })
    const otpauth = totp.toURI({ label: accountName, issuer: APP_NAME, secret });
    return { secret, otpauth };
}

export async function generateQRCode(otpauth: string) {
    return await QRCode.toDataURL(otpauth);
}

export async function verifyTwoFactorToken(token: string, secret: string) {
    try {
        // verify(token, { secret, ...opts })
        // epochTolerance: 30 means +/- 30 seconds (1 step)
        const result = await totp.verify(token, { secret, epochTolerance: 30 });
        return result && result.valid;
    } catch (err) {
        console.error("2FA Verify Error:", err);
        return false;
    }
}
