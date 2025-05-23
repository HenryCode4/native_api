import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, author, description, image } = req.body;
    if (!title || !author || !description || !image) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // upload image to cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image);
    const imageUrl = uploadResponse.secure_url;
    //save to mongo db

    const book = new Book({
      title,
      author,
      description,
      image: imageUrl,
      user: req.user._id,
    });
    await book.save();
    res.status(201).json({
      message: "Book added successfully",
      book,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("Error in book route", error);
  }
});

router.get("/", protectRoute, async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 5;
  const skip = (page - 1) * limit;
  try {
    const books = await Book.find()
      .sort({ createdAt: -1 })
      .populate("user", "username profileImage")
      .limit(limit)
      .skip(skip);

    if (!books) {
      return res.status(404).json({ message: "No books found" });
    }
    const totalBooks = await Book.countDocuments();
    const totalPages = Math.ceil(totalBooks / limit);

    res.status(200).json({
      message: "Books fetched successfully",
      books,
      currentPage: page,
      totalBooks,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("Error in book route", error);
  }
});

router.get("/user", protectRoute, async (req, res) => {
    try {
        const books = await Book.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            res.status(200).json({
                message: "Books posted by current user fetched successfully",
                books,
            })
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log("Error in book route", error);
    }
})

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.user.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this book" });
    }
    // delete image from cloudinary
    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.log("Error in deleting image from cloudinary", error);
      }
    }
    // delete book from mongo db
    await book.deleteOne();
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("Error in book route", error);
  }
});

export default router;
