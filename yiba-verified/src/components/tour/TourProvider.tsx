"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { driver, Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_STEPS } from "./tour-config";

type TourContextType = {
    startTour: (role: string) => void;
    resetTourHistory: (role: string) => void;
    isActive: boolean;
};

const TourContext = createContext<TourContextType | undefined>(undefined);

export function useTour() {
    const context = useContext(TourContext);
    if (!context) {
        throw new Error("useTour must be used within a TourProvider");
    }
    return context;
}

interface TourProviderProps {
    children: React.ReactNode;
    userRole?: string; // specific role passed from auth
}

export function TourProvider({ children, userRole }: TourProviderProps) {
    const driverRef = useRef<Driver | null>(null);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        // Initialize driver
        driverRef.current = driver({
            animate: true,
            showProgress: true,
            allowClose: true,
            onDestroyStarted: () => {
                setIsActive(false);
                // If we wanted to perform an action when the user continually tries to close
                return true;
            },
            onPopoverRender: (popover, { config, state }) => {
                // Custom styling hooks if needed
            },
        });
    }, []);

    const startTour = (role: string) => {
        const steps = TOUR_STEPS[role];
        if (!steps || steps.length === 0) {
            console.warn(`No tour steps defined for role: ${role}`);
            return;
        }

        if (driverRef.current) {
            setIsActive(true);
            driverRef.current.setSteps(steps);
            driverRef.current.drive();
        }
    };

    const resetTourHistory = (role: string) => {
        if (typeof window !== "undefined") {
            localStorage.removeItem(`hasSeenTour_${role}`);
        }
    };

    // Auto-start disabled (trigger via WelcomeModal)
    /*
    useEffect(() => {
        if (!userRole) return;

        // Simple mock logic for prototype: check local storage
        const hasSeen = localStorage.getItem(`hasSeenTour_${userRole}`);
        if (!hasSeen) {
            // Small delay to ensure UI is ready
            setTimeout(() => {
                startTour(userRole);
                localStorage.setItem(`hasSeenTour_${userRole}`, "true");
            }, 1500);
        }
    }, [userRole]);
    */

    return (
        <TourContext.Provider value={{ startTour, resetTourHistory, isActive }}>
            {children}
        </TourContext.Provider>
    );
}
