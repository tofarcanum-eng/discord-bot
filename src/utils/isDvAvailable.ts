import { IConfig } from "../models/configModel";


export function isDvAvailable(
    config: IConfig
): boolean {

    // No available period means unavailable
    if (
        !config.dvAvailableStart ||
        !config.dvAvailableEnd
    ) {

        return false;

    }


    // Use IST instead of UTC
    const today = new Date()
        .toLocaleDateString(
            "en-CA",
            {
                timeZone: "Asia/Kolkata"
            }
        );


    return (

        today >= config.dvAvailableStart

        &&

        today <= config.dvAvailableEnd

    );

}