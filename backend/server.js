import express from "express";
import "dotenv/config";
import cors from "cors";
import chatRoutes from "./routes/chat.js";

import mongoose from "mongoose";

const app= express();
const PORT =process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

app.use("/api", chatRoutes);

const connectDb = async() =>{
    try{
        await mongoose.connect(process.env.MongoDbURI);
        console.log("Connected with database");
    }catch(err){
        console.log("Failed to connect with db " ,err);
    }
}

app.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
    connectDb();
});

