import { Config } from "../models/configModel";


export async function createDefaultConfig() {

    const config =
        await Config.findOne();


    if (!config) {

        await Config.create({

            channelID: "",

            roleID: "",

            hour: 4,

            minute: 0,

            days: [0,1,3,4,5,6],

            dvAvailableStart: null,

            dvAvailableEnd: null

        });


        console.log(
            "Default configuration created."
        );

    }

}