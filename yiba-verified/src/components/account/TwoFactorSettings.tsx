"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldAlert, QrCode } from "lucide-react";
import Image from "next/image";

interface Props {
    initialEnabled: boolean;
}

export function TwoFactorSettings({ initialEnabled }: Props) {
    const [step, setStep] = useState<"idle" | "setup" | "verify">("idle");
    const [loading, setLoading] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [token, setToken] = useState("");
    const [isEnabled, setIsEnabled] = useState(initialEnabled);

    const handleStartSetup = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setQrCode(data.qrCode);
            setStep("setup");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEnable = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/2fa/toggle", {
                method: "POST",
                body: JSON.stringify({ action: "enable", token }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            toast.success("2FA Enabled Successfully");
            setIsEnabled(true);
            setStep("idle");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        if (!confirm("Are you sure you want to disable Two-Factor Authentication? This will reduce your account security.")) return;
        setLoading(true);
        try {
            const res = await fetch("/api/auth/2fa/toggle", {
                method: "POST",
                body: JSON.stringify({ action: "disable" }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            toast.success("2FA Disabled Successfully");
            setIsEnabled(false);
            setQrCode(null);
            setToken("");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account.
                    </p>
                </div>
                {isEnabled ? (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="text-green-600 border-green-200 bg-green-50 pointer-events-none">
                            <ShieldCheck className="mr-2 h-4 w-4" /> Enabled
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDisable} disabled={loading}>
                            Disable
                        </Button>
                    </div>
                ) : (
                    <Button onClick={handleStartSetup} disabled={step !== "idle" || loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Setup 2FA
                    </Button>
                )}
            </div>

            {step === "setup" && qrCode && !isEnabled && (
                <div className="border p-4 rounded-lg bg-muted/50 space-y-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-2 rounded-lg">
                            <Image src={qrCode} alt="QR Code" width={160} height={160} unoptimized />
                        </div>
                        <p className="text-sm text-center text-muted-foreground">
                            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                        </p>
                    </div>
                    <div className="space-y-2 max-w-xs mx-auto">
                        <Label>Verification Code</Label>
                        <div className="flex gap-2">
                            <Input
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="123456"
                                maxLength={6}
                            />
                            <Button onClick={handleEnable} disabled={loading || token.length !== 6}>
                                Verify
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
