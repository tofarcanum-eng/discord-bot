import mongoose from "mongoose";


export interface IConfig
    extends mongoose.Document {

    channelReminderID: string;

    channelAnnouncementID: string;

    channelFountainID: string;

    roleID: string;

    hour: number;

    minute: number;

    days: number[];

    dvAvailableStart: string | null;

    dvAvailableEnd: string | null;

}


const configSchema = new mongoose.Schema<IConfig>({

    channelReminderID: {

        type: String,

        default: ""

    },

    channelAnnouncementID: {
        type: String,
        default: ""
    },

    channelFountainID: {
        type: String,
        default: ""
    },


    roleID: {

        type: String,

        default: ""

    },


    hour: {

        type: Number,

        default: 4

    },


    minute: {

        type: Number,

        default: 0

    },


    days: {

        type: [Number],

        default: [0,1,3,4,5,6]

    },


    dvAvailableStart: {

        type: String,

        default: null

    },


    dvAvailableEnd: {

        type: String,

        default: null

    }

});


export const Config = mongoose.model<IConfig>(

    "Config",

    configSchema

);