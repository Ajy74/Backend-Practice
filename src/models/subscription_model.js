import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // those who subscribe
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // for whome user is subscribe
        ref: "User"
    },
}, {timestamps: true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema); 