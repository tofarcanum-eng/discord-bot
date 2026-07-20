import fs from "fs";
import path from "path";

export interface Config {
    channelID: string;
    roleID: string;
    hour: number;
    minute: number;
    days: number[];
    dvAvailableStart?:string;
    dvAvailableEnd?:string;
}

const CONFIG_DIR = path.join(process.cwd(), "src", "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function loadConfig(): Config {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            throw new Error(`Config file not found at ${CONFIG_FILE}`);
        }
        const data = fs.readFileSync(CONFIG_FILE, "utf-8");
        return JSON.parse(data);
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
export function isDvAvailable(){

    const config = loadConfig();


    if(

        !config.dvAvailableStart ||

        !config.dvAvailableEnd

    ){

        return false;

    }


    const today =

        new Date()

            .toISOString()

            .split("T")[0];


    return(

        today >=
        config.dvAvailableStart

        &&

        today <=
        config.dvAvailableEnd

    );

}