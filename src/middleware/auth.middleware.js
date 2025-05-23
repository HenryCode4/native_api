import jwt from "jsonwebtoken";

import User from "../models/User.js";

const protectRoute = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, access denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");
        if(!user) {
            return res.status(401).json({ message: "Not authorized, Token is invalid" });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error("Error in auth middleware", error);
        res.status(401).json({ message: "Not authorized, token failed" });
    }
}

export default protectRoute