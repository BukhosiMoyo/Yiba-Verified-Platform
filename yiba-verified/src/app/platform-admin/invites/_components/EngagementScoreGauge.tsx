interface EngagementScoreGaugeProps {
    score: number;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export function EngagementScoreGauge({
    score,
    size = "md",
    showLabel = true,
}: EngagementScoreGaugeProps) {
    // Clamp score between 0-100
    const clampedScore = Math.max(0, Math.min(100, score));

    // Determine color based on score
    const getColor = (score: number) => {
        if (score < 31) return { stroke: "stroke-red-500", text: "text-red-600" };
        if (score < 61) return { stroke: "stroke-yellow-500", text: "text-yellow-600" };
        return { stroke: "stroke-green-500", text: "text-green-600" };
    };

    const colors = getColor(clampedScore);

    // Size configurations
    const sizeConfig = {
        sm: { width: 60, strokeWidth: 4, fontSize: "text-xs" },
        md: { width: 80, strokeWidth: 6, fontSize: "text-sm" },
        lg: { width: 120, strokeWidth: 8, fontSize: "text-lg" },
    };

    const config = sizeConfig[size];
    const radius = (config.width - config.strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clampedScore / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative" style={{ width: config.width, height: config.width }}>
                <svg
                    className="transform -rotate-90"
                    width={config.width}
                    height={config.width}
                >
                    {/* Background circle */}
                    <circle
                        cx={config.width / 2}
                        cy={config.width / 2}
                        r={radius}
                        className="stroke-gray-200 dark:stroke-gray-700"
                        strokeWidth={config.strokeWidth}
                        fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                        cx={config.width / 2}
                        cy={config.width / 2}
                        r={radius}
                        className={colors.stroke}
                        strokeWidth={config.strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{
                            transition: "stroke-dashoffset 0.5s ease",
                        }}
                    />
                </svg>
                {/* Score text in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`font-bold ${colors.text} ${config.fontSize}`}>
                        {Math.round(clampedScore)}
                    </span>
                </div>
            </div>
            {showLabel && (
                <span className="text-xs text-muted-foreground">Score</span>
            )}
        </div>
    );
}
