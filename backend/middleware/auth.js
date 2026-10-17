import jwt from "jsonwebtoken";
import User from "../models/User.js";

//verifies the "Authorization: Bearer <token>" header and attaches req.user
const requireAuth = async (req, res, next) => {
    const header = req.headers.authorization || "";

    if(!header.startsWith("Bearer ")) {
        return res.status(401).json({error: "Not authorized, no token provided"});
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if(!user) {
            return res.status(401).json({error: "Not authorized, user no longer exists"});
        }

        req.user = user;
        next();
    } catch(err) {
        return res.status(401).json({error: "Not authorized, token is invalid or expired"});
    }
};

export default requireAuth;
