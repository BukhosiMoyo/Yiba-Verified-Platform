"use client";

import { useForm } from "react-hook-form";
import { BatchConfig } from "@/lib/outreach/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface BatchConfigFormProps {
    config: BatchConfig;
    onSave: (config: BatchConfig) => void;
}

export function BatchConfigForm({ config, onSave }: BatchConfigFormProps) {
    const { register, handleSubmit, watch, setValue } = useForm<BatchConfig>({
        defaultValues: config,
    });

    const jitterEnabled = watch("jitter_enabled");
    const jitterMax = watch("jitter_max_minutes");

    const onSubmit = (data: BatchConfig) => {
        onSave({
            ...data,
            batch_size: Number(data.batch_size),
            schedule_start_hour: Number(data.schedule_start_hour),
            schedule_end_hour: Number(data.schedule_end_hour),
            jitter_max_minutes: Number(data.jitter_max_minutes),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sending Configuration</CardTitle>
                <CardDescription>
                    Control how and when emails are delivered
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Hourly Batch Size</Label>
                        <Input
                            type="number"
                            {...register("batch_size", { min: 1, max: 1000 })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Maximum emails sent per hour per IP.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Hour (24h)</Label>
                            <Input
                                type="number"
                                {...register("schedule_start_hour", { min: 0, max: 23 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Hour (24h)</Label>
                            <Input
                                type="number"
                                {...register("schedule_end_hour", { min: 0, max: 23 })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 rounded-lg border p-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="jitter"
                                checked={jitterEnabled}
                                onCheckedChange={(checked) =>
                                    setValue("jitter_enabled", checked as boolean)
                                }
                            />
                            <Label htmlFor="jitter" className="font-medium">
                                Enable Jitter (Randomization)
                            </Label>
                        </div>

                        {jitterEnabled && (
                            <div className="space-y-2 pl-6">
                                <Label>Max Random Delay: {jitterMax} minutes</Label>
                                <Slider
                                    min={1}
                                    max={60}
                                    step={1}
                                    value={[jitterMax]}
                                    onValueChange={(val) => setValue("jitter_max_minutes", val[0])}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Adds random delay to simulate human behavior.
                                </p>
                            </div>
                        )}
                    </div>

                    <Button type="submit">Save Configuration</Button>
                </form>
            </CardContent>
        </Card>
    );
}
