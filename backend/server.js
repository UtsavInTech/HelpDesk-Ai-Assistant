import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";

import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 8080;

//falls back to a local MongoDB so the project runs on localhost out of the box
const MONGO_URI = process.env.MongoDbURI || "mongodb://127.0.0.1:27017/sigmagpt";

if(!process.env.JWT_SECRET) {
    console.error("Missing JWT_SECRET in .env - authentication cannot start.");
    process.exit(1);
}

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => res.json({status: "SigmaGPT API is running"}));

app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

const connectDb = async() => {
    try{
        await mongoose.connect(MONGO_URI, {serverSelectionTimeoutMS: 10000});
        console.log("Connected with database");
    }catch(err){
        console.log("Failed to connect with db ", err.message);
        process.exit(1);
    }
}

//connect first, then listen - so the server never accepts traffic it cannot serve
await connectDb();

app.listen(PORT, () => {
    console.log(`SigmaGPT server running on http://localhost:${PORT}`);
});
