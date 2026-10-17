import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    role : {
        type: String,
        enum: ["user", "assistant"],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

//a PDF attached to a thread, already extracted to plain text
const DocumentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    pages: {
        type: Number,
        default: 0
    },
    truncated: {
        type: Boolean,
        default: false
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const ThreadSchema = new mongoose.Schema({
    //every thread belongs to exactly one account
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    threadId:{
        type: String,
        required: true
    },
    title:{
        type: String,
        default: "New Chat",
    },
    messages: [MessageSchema],
    documents: [DocumentSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    }
});

//a threadId only has to be unique inside one account
ThreadSchema.index({user: 1, threadId: 1}, {unique: true});

export default mongoose.model("Thread" , ThreadSchema);
