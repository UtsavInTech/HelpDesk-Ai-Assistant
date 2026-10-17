import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        default: ""
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Please enter a valid email address"]
    },
    password: {
        type: String,
        required: true,
        //never returned by a normal query
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

//hash the password before it ever touches the database
//mongoose 9 awaits async hooks, so there is no next() callback here
UserSchema.pre("save", async function() {
    if(!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = function(plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

export default mongoose.model("User", UserSchema);
