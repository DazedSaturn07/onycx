"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface PreloadContextType {
    registerAsset: (id: string) => void;
    markLoaded: (id: string) => void;
    isLoading: boolean;
    progress: number; // 0 to 1
    totalAssets: number;
    loadedAssets: number;
}

const PreloadContext = createContext<PreloadContextType | undefined>(undefined);

export function PreloadProvider({ children }: { children: React.ReactNode }) {
    const [registry, setRegistry] = useState<Set<string>>(new Set());
    const [loaded, setLoaded] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [minTimeElapsed, setMinTimeElapsed] = useState(false);

    // Minimum loading time to prevent flickering (e.g. 2 seconds)
    useEffect(() => {
        const timer = setTimeout(() => {
            setMinTimeElapsed(true);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const registerAsset = useCallback((id: string) => {
        setRegistry((prev) => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    }, []);

    const markLoaded = useCallback((id: string) => {
        setLoaded((prev) => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    }, []);

    useEffect(() => {
        // If we have registered assets and all are loaded AND min time has passed
        // Or if no assets are registered but min time passed (fallback)
        const total = registry.size;
        const count = loaded.size;

        // Check if we are "done"
        // We strictly wait for minTimeElapsed.
        // We also strictly wait for ALL registered assets if there are any.
        // If there are 0 registered assets, we wait for minTimeElapsed then finish.

        // However, assets might register LATE (after mount). 
        // So we need to be careful not to finish too early if the first component hasn't mounted yet.
        // But usually components mount immediately.

        const allLoaded = total > 0 && count >= total;
        const fallbackFinish = total === 0 && minTimeElapsed; // Nothing to load? Just finish after timer.

        if (minTimeElapsed) {
            if (allLoaded || fallbackFinish) {
                // Small buffer to ensure state updates settle
                const finishTimer = setTimeout(() => setIsLoading(false), 500);
                return () => clearTimeout(finishTimer);
            }
        }
    }, [registry.size, loaded.size, minTimeElapsed]);

    const totalAssets = registry.size;
    const loadedAssets = loaded.size;
    // Progress computation
    // If total is 0, we can fake progress based on time, or just keep it 0 until minTime.
    // For simplicity, let's just use asset ratio. 
    // If total is 0, progress is 0 (or 1 if done).
    let progress = totalAssets > 0 ? loadedAssets / totalAssets : 0;

    // If we are finished loading, force progress to 1
    if (!isLoading) progress = 1;

    return (
        <PreloadContext.Provider
            value={{
                registerAsset,
                markLoaded,
                isLoading,
                progress,
                totalAssets,
                loadedAssets,
            }}
        >
            {children}
        </PreloadContext.Provider>
    );
}

export function usePreload() {
    const context = useContext(PreloadContext);
    if (context === undefined) {
        throw new Error("usePreload must be used within a PreloadProvider");
    }
    return context;
}
