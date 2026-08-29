const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

const PORT = process.env.PORT || 3000;

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;


// =========================================
// MIDDLEWARE
// =========================================

app.use(cors({
    origin: "*"
}));

app.use(express.json({
    limit: "20mb"
}));


// =========================================
// DATABASE
// =========================================

let db;
let storiesCollection;


async function connectDatabase() {

    try {

        if (!MONGODB_URI) {
            throw new Error("MONGODB_URI is not configured.");
        }

        const client = new MongoClient(MONGODB_URI);

        await client.connect();

        db = client.db("usma_universe");

        storiesCollection =
            db.collection("stories");

        console.log("MongoDB connected.");

    } catch (error) {

        console.error(
            "MongoDB connection error:",
            error
        );

        process.exit(1);
    }
}


// =========================================
// HOME
// =========================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "USMA Universe Backend is running."
    });

});


// =========================================
// HEALTH CHECK
// =========================================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        status: "online"
    });

});


// =========================================
// ADMIN LOGIN
// =========================================

app.post("/api/admin/login", (req, res) => {

    try {

        const { password } = req.body;

        if (!ADMIN_PASSWORD) {

            return res.status(500).json({
                success: false,
                message: "Admin password is not configured."
            });

        }

        if (!password) {

            return res.status(400).json({
                success: false,
                message: "Password is required."
            });

        }

        if (password !== ADMIN_PASSWORD) {

            return res.status(401).json({
                success: false,
                message: "Invalid admin password."
            });

        }

        res.json({
            success: true,
            message: "Admin authentication successful."
        });

    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error."
        });

    }

});


// =========================================
// CREATE STORY
// =========================================

app.post("/api/stories", async (req, res) => {

    try {

        const {
            firstName,
            lastName,
            story
        } = req.body;


        if (
            !firstName ||
            !lastName ||
            !story
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please complete all fields."

            });

        }


        const newStory = {

            firstName:
                firstName.trim(),

            lastName:
                lastName.trim(),

            story:
                story.trim(),

            status:
                "PENDING",

            submittedAt:
                new Date().toISOString(),

            approvedAt:
                null,

            rejectedAt:
                null

        };


        const result =
            await storiesCollection.insertOne(
                newStory
            );


        res.status(201).json({

            success: true,

            message:
                "Story submitted successfully.",

            story: {
                ...newStory,
                _id: result.insertedId
            }

        });

    } catch (error) {

        console.error(
            "Create story error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Server error."

        });

    }

});


// =========================================
// APPROVED STORIES
// =========================================

app.get("/api/stories/approved", async (req, res) => {

    try {

        const stories =
            await storiesCollection
                .find({
                    status: "APPROVED"
                })
                .sort({
                    approvedAt: -1
                })
                .toArray();


        res.json({

            success: true,

            stories

        });

    } catch (error) {

        console.error(
            "Approved stories error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Server error."

        });

    }

});


// =========================================
// ADMIN AUTH MIDDLEWARE
// =========================================

function requireAdmin(req, res, next) {

    const password =
        req.headers["x-admin-password"];


    if (!ADMIN_PASSWORD) {

        return res.status(500).json({

            success: false,

            message:
                "Admin password is not configured."

        });

    }


    if (
        !password ||
        password !== ADMIN_PASSWORD
    ) {

        return res.status(401).json({

            success: false,

            message:
                "Unauthorized."

        });

    }


    next();

}


// =========================================
// ADMIN — GET ALL STORIES
// =========================================

app.get(
    "/api/admin/stories",
    requireAdmin,
    async (req, res) => {

        try {

            const stories =
                await storiesCollection
                    .find({})
                    .sort({
                        submittedAt: -1
                    })
                    .toArray();


            res.json({

                success: true,

                stories

            });

        } catch (error) {

            console.error(
                "Admin stories error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Server error."

            });

        }

    }
);


// =========================================
// ADMIN — APPROVE STORY
// =========================================

app.patch(
    "/api/admin/stories/:id/approve",
    requireAdmin,
    async (req, res) => {

        try {

            const id =
                new ObjectId(req.params.id);


            const result =
                await storiesCollection.updateOne(

                    {
                        _id: id
                    },

                    {
                        $set: {

                            status:
                                "APPROVED",

                            approvedAt:
                                new Date().toISOString(),

                            rejectedAt:
                                null

                        }

                    }

                );


            if (
                result.matchedCount === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Story not found."

                });

            }


            res.json({

                success: true,

                message:
                    "Story approved successfully."

            });

        } catch (error) {

            console.error(
                "Approve story error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Server error."

            });

        }

    }
);


// =========================================
// ADMIN — REJECT STORY
// =========================================

app.patch(
    "/api/admin/stories/:id/reject",
    requireAdmin,
    async (req, res) => {

        try {

            const id =
                new ObjectId(req.params.id);


            const result =
                await storiesCollection.updateOne(

                    {
                        _id: id
                    },

                    {
                        $set: {

                            status:
                                "REJECTED",

                            rejectedAt:
                                new Date().toISOString(),

                            approvedAt:
                                null

                        }

                    }

                );


            if (
                result.matchedCount === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Story not found."

                });

            }


            res.json({

                success: true,

                message:
                    "Story rejected successfully."

            });

        } catch (error) {

            console.error(
                "Reject story error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Server error."

            });

        }

    }
);


// =========================================
// ADMIN — DELETE STORY
// =========================================

app.delete(
    "/api/admin/stories/:id",
    requireAdmin,
    async (req, res) => {

        try {

            const id =
                new ObjectId(req.params.id);


            const result =
                await storiesCollection.deleteOne({

                    _id: id

                });


            if (
                result.deletedCount === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Story not found."

                });

            }


            res.json({

                success: true,

                message:
                    "Story deleted successfully."

            });

        } catch (error) {

            console.error(
                "Delete story error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Server error."

            });

        }

    }
);


// =========================================
// START SERVER
// =========================================

async function startServer() {

    await connectDatabase();


    app.listen(PORT, () => {

        console.log(
            `USMA Universe Backend running on port ${PORT}`
        );

    });

}


startServer();
