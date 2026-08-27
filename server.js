const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

const DB_NAME = "usma_universe";
const COLLECTION_NAME = "stories";


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors({
    origin: "*"
}));

app.use(express.json({
    limit: "10mb"
}));


// ==========================================
// MONGODB
// ==========================================

let db;
let storiesCollection;

async function connectDatabase() {

    if (!MONGODB_URI) {

        console.error(
            "MONGODB_URI environment variable is missing."
        );

        process.exit(1);

    }

    try {

        const client =
            new MongoClient(MONGODB_URI);

        await client.connect();

        db =
            client.db(DB_NAME);

        storiesCollection =
            db.collection(COLLECTION_NAME);

        await db.command({
            ping: 1
        });

        console.log(
            "================================="
        );

        console.log(
            "MongoDB Atlas connected successfully."
        );

        console.log(
            `Database: ${DB_NAME}`
        );

        console.log(
            `Collection: ${COLLECTION_NAME}`
        );

        console.log(
            "================================="
        );

    } catch (error) {

        console.error(
            "MongoDB connection error:",
            error
        );

        process.exit(1);

    }

}


// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {

    res.json({

        success: true,

        message:
            "USMA Universe Backend is running."

    });

});


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", async (req, res) => {

    try {

        await db.command({
            ping: 1
        });

        res.json({

            success: true,

            status:
                "online",

            database:
                "connected"

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            status:
                "offline",

            database:
                "disconnected"

        });

    }

});


// ==========================================
// SUBMIT STORY
// ==========================================

app.post("/api/stories", async (req, res) => {

    try {

        const {
            firstName,
            lastName,
            story
        } = req.body;


        // Check required fields

        if (
            !firstName ||
            !lastName ||
            !story
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please complete all required fields."

            });

        }


        // Clean input

        const cleanFirstName =
            firstName.trim();

        const cleanLastName =
            lastName.trim();

        const cleanStory =
            story.trim();


        // Check empty values

        if (
            !cleanFirstName ||
            !cleanLastName ||
            !cleanStory
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please complete all required fields."

            });

        }


        // Create story

        const newStory = {

            id:
                "VOICE-" +
                Date.now()
                    .toString()
                    .slice(-6),

            firstName:
                cleanFirstName,

            lastName:
                cleanLastName,

            story:
                cleanStory,

            status:
                "PENDING",

            submittedAt:
                new Date().toISOString()

        };


        // Save to MongoDB

        await storiesCollection.insertOne(
            newStory
        );


        console.log(
            "================================="
        );

        console.log(
            "NEW USMA VOICE"
        );

        console.log(newStory);

        console.log(
            "================================="
        );


        res.status(201).json({

            success: true,

            message:
                "Your story has been submitted successfully.",

            story:
                newStory

        });


    } catch (error) {

        console.error(
            "Submit story error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Server error."

        });

    }

});


// ==========================================
// GET PENDING STORIES
// ==========================================

app.get(
    "/api/stories/pending",
    async (req, res) => {

        try {

            const pendingStories =
                await storiesCollection
                    .find({
                        status: "PENDING"
                    })
                    .sort({
                        submittedAt: -1
                    })
                    .toArray();


            res.json({

                success: true,

                stories:
                    pendingStories

            });

        } catch (error) {

            console.error(
                "Get pending stories error:",
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


// ==========================================
// GET APPROVED STORIES
// ==========================================

app.get(
    "/api/stories/approved",
    async (req, res) => {

        try {

            const approvedStories =
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

                stories:
                    approvedStories

            });

        } catch (error) {

            console.error(
                "Get approved stories error:",
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


// ==========================================
// APPROVE STORY
// ==========================================

app.patch(
    "/api/stories/:id/approve",
    async (req, res) => {

        try {

            const storyId =
                req.params.id;

            const approvedAt =
                new Date().toISOString();


            const result =
                await storiesCollection.updateOne(

                    {
                        id: storyId
                    },

                    {
                        $set: {

                            status:
                                "APPROVED",

                            approvedAt:
                                approvedAt

                        },

                        $unset: {

                            rejectedAt:
                                ""

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


            const updatedStory =
                await storiesCollection.findOne({

                    id: storyId

                });


            res.json({

                success: true,

                message:
                    "Story approved successfully.",

                story:
                    updatedStory

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


// ==========================================
// REJECT STORY
// ==========================================

app.patch(
    "/api/stories/:id/reject",
    async (req, res) => {

        try {

            const storyId =
                req.params.id;

            const rejectedAt =
                new Date().toISOString();


            const result =
                await storiesCollection.updateOne(

                    {
                        id: storyId
                    },

                    {
                        $set: {

                            status:
                                "REJECTED",

                            rejectedAt:
                                rejectedAt

                        },

                        $unset: {

                            approvedAt:
                                ""

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


            const updatedStory =
                await storiesCollection.findOne({

                    id: storyId

                });


            res.json({

                success: true,

                message:
                    "Story rejected successfully.",

                story:
                    updatedStory

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


// ==========================================
// DELETE STORY
// ==========================================

app.delete(
    "/api/stories/:id",
    async (req, res) => {

        try {

            const storyId =
                req.params.id;


            const result =
                await storiesCollection.deleteOne({

                    id: storyId

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


// ==========================================
// START SERVER
// ==========================================

async function startServer() {

    await connectDatabase();

    app.listen(
        PORT,
        () => {

            console.log(
                `USMA Universe Backend running on port ${PORT}`
            );

        }
    );

}


startServer();
