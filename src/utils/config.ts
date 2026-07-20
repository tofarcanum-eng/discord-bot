import fs from "fs";
import path from "path";

export interface Config {
    channelID: string;
    roleID: string;
    hour: number;
    minute: number;
    days: number[];
    dvUnavailableStart?: string; // ISO string (YYYY-MM-DD)
    dvUnavailableEnd?: string;   // ISO string (YYYY-MM-DD)
}

const CONFIG_DIR = path.join(process.cwd(), "src", "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function loadConfig(): Config {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, "utf-8");
            return JSON.parse(data);
        }

    } catch (error) {
        console.error("Error loading config:", error);
        throw error;
    }
}

export function saveConfig(config: Config): void {
    try {
        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4));
    } catch (error) {
        console.error("Error saving config:", error);
        throw error;
    }
}

/**
 * Check if DV is currently available
 * Returns false if we're within the unavailable date range
 */
export function isDvAvailable(): boolean {
    const config = loadConfig();

    if (!config.dvUnavailableStart || !config.dvUnavailableEnd) {
        return true; // Available by default
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const start = config.dvUnavailableStart;
    const end = config.dvUnavailableEnd;

    // Check if today is within the unavailable range
    return !(today >= start && today <= end);
}