"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createAdminUser } from "@/actions/admin-setup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

const initialState = {
    success: false,
    message: "",
};

export default function SecretSetupPage() {
    const [state, formAction] = useFormState(createAdminUser, initialState);
    const [role, setRole] = useState("PLATFORM_ADMIN");

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">
                        Secret Admin Setup
                    </CardTitle>
                    <CardDescription className="text-center">
                        Create a privileged account securely.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        {state.message && (
                            <Alert variant={state.success ? "default" : "destructive"}>
                                {state.success ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <AlertCircle className="h-4 w-4" />
                                )}
                                <AlertTitle>{state.success ? "Success" : "Error"}</AlertTitle>
                                <AlertDescription>{state.message}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="secretCode">Secret Code</Label>
                            <Input
                                id="secretCode"
                                name="secretCode"
                                type="password"
                                placeholder="Enter the secret setup code"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    placeholder="Jane"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    placeholder="Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="admin@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="********"
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select name="role" value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PLATFORM_ADMIN">Platform Admin</SelectItem>
                                    <SelectItem value="QCTO_SUPER_ADMIN">
                                        QCTO Super Admin
                                    </SelectItem>
                                    <SelectItem value="QCTO_USER">QCTO User</SelectItem>
                                    <SelectItem value="INSTITUTION_ADMIN">
                                        Institution Admin (No Inst Link)
                                    </SelectItem>
                                    <SelectItem value="STUDENT">Student</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Note: Institution/Student roles created here won't be linked to an
                                institution initially.
                            </p>
                        </div>

                        <Button type="submit" className="w-full mt-4">
                            Create User
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center text-xs text-muted-foreground">
                    Protected by server-side secret verification.
                </CardFooter>
            </Card>
        </div>
    );
}
