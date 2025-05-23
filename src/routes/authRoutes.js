import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router =  express.Router();

const generateToken = ( userId) => {
    return jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN})
}

router.post("/register", async (req, res)=> {
    try {
        const {email, username, password} = req.body;
        if (!email || !username || !password) {
            return res.status(400).json({message: "Please fill all fields"});
        }

        if(password.length < 6) {
            return res.status(400).json({message: "Password must be at least 6 characters"});
        }

        if(username < 3) {
            return res.status(400).json({message: "Username must be at least 3 characters"});
        }
        // Check if user already exists
        const existingUser = await User.findOne({$or: [{email}, {username}]});

        if(existingUser) {
            return res.status(400).json({message: "User already exists"});
        }

        // get random image 
        const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

        const user = new User({
            email,
            username,
            password,
            profileImage
        })

        await user.save();

        const token =  generateToken(user._id);

        res.status(201).json({
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                profileImage: user.profileImage
            },
            token
        });

    } catch (error) {
        console.log("Error in register route", error);
        res.status(500).json({message: "Internal server error"});
    }
});


router.post("/login", async (req, res)=> {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
            return res.status(400).json({message: "Please fill all fields"});
        }

        // Check if user exists
        const user = await User.findOne({email});
        if (!user) {
            return res.status(400).json({message: "Invalid credentials"});
        }

        // Check if password is correct
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(400).json({message: "Invalid credentials"});
        }

        const token =  generateToken(user._id);
        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                profileImage: user.profileImage
            },
            token
        });
    } catch (error) {
        console.log("Error in login route", error);
        res.status(500).json({message: "Internal server error"});
    }
});

export default router;