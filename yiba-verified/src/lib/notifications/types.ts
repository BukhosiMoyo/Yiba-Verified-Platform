export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export type NotificationCategory =
    | "ACADEMIC"
    | "COMPLIANCE"
    | "SYSTEM"
    | "MARKETING"
    | "SECURITY"
    | "COMMUNICATION";

export interface CreateNotificationParams {
    userId: string;
    type: string; // The system event type (e.g. SUBMISSION_REVIEWED)
    title: string;
    message: string;

    // Categorization
    category?: NotificationCategory;
    priority?: NotificationPriority;
    channels?: NotificationChannel[]; // If not provided, defaults to all/preferences

    // Context
    resourceType?: string;
    resourceId?: string;

    // RBAC safety
    recipientRole?: string;
    institutionId?: string;

    // Direct Action
    actionLink?: string;
}

export interface NotificationServiceResult {
    notificationId?: string; // If in-app was created
    emailQueued?: boolean;
    emailSent?: boolean;
    smsQueued?: boolean;
    skipped?: boolean;
    error?: any;
}
