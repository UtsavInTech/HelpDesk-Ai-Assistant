import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

const signToken = (userId) => {
    return jwt.sign({id: userId}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    });
};

//a "good password": 8+ chars with an uppercase, a lowercase, a digit and a symbol
const validatePassword = (password) => {
    if(!password || password.length < 8) return "Password must be at least 8 characters long";
    if(!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
    if(!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
    if(!/[0-9]/.test(password)) return "Password must contain a number";
    if(!/[^A-Za-z0-9]/.test(password)) return "Password must contain a special character";
    return null;
};

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email
});

//Register with an email id + password
router.post("/signup", async(req, res) => {
    const {name = "", email, password} = req.body;

    if(!email || !password) {
        return res.status(400).json({error: "Email and password are required"});
    }

    const passwordError = validatePassword(password);
    if(passwordError) {
        return res.status(400).json({error: passwordError});
    }

    try {
        const existing = await User.findOne({email: email.toLowerCase().trim()});

        if(existing) {
            return res.status(409).json({error: "An account with this email already exists"});
        }

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password
        });

        res.status(201).json({
            token: signToken(user._id),
            user: publicUser(user)
        });
    } catch(err) {
        console.log(err);

        if(err.name === "ValidationError") {
            return res.status(400).json({error: Object.values(err.errors)[0].message});
        }

        res.status(500).json({error: "Failed to create account"});
    }
});

//Login with an email id + password
router.post("/login", async(req, res) => {
    const {email, password} = req.body;

    if(!email || !password) {
        return res.status(400).json({error: "Email and password are required"});
    }

    try {
        //password is select:false on the schema, so ask for it explicitly
        const user = await User.findOne({email: email.toLowerCase().trim()}).select("+password");

        if(!user || !(await user.comparePassword(password))) {
            //same message either way so we never leak which emails are registered
            return res.status(401).json({error: "Invalid email or password"});
        }

        res.json({
            token: signToken(user._id),
            user: publicUser(user)
        });
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to log in"});
    }
});

//Who am I - used by the frontend to restore a session from a saved token
router.get("/me", requireAuth, (req, res) => {
    res.json({user: publicUser(req.user)});
});

//Update the display name
router.patch("/me", requireAuth, async(req, res) => {
    const {name} = req.body;

    if(typeof name !== "string") {
        return res.status(400).json({error: "Name is required"});
    }

    if(name.trim().length > 60) {
        return res.status(400).json({error: "Name must be 60 characters or fewer"});
    }

    try {
        req.user.name = name.trim();
        await req.user.save();

        res.json({user: publicUser(req.user)});
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to update your profile"});
    }
});

//Change the password - the current one has to be proved first
router.patch("/me/password", requireAuth, async(req, res) => {
    const {currentPassword, newPassword} = req.body;

    if(!currentPassword || !newPassword) {
        return res.status(400).json({error: "Current and new password are required"});
    }

    const passwordError = validatePassword(newPassword);
    if(passwordError) {
        return res.status(400).json({error: passwordError});
    }

    if(currentPassword === newPassword) {
        return res.status(400).json({error: "The new password must be different from the current one"});
    }

    try {
        const user = await User.findById(req.user._id).select("+password");

        if(!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({error: "Your current password is incorrect"});
        }

        //the pre-save hook hashes it
        user.password = newPassword;
        await user.save();

        //hand back a fresh token so the session stays valid
        res.json({token: signToken(user._id), user: publicUser(user)});
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to change your password"});
    }
});

export default router;
