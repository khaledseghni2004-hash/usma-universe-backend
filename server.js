const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors({
    origin: "*"
}));

app.use(express.json({
    limit: "20mb"
}));


// =========================================
// MONGODB
// =========================================

let db;
let storiesCollection;


async function connectMongoDB() {

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
            client.db("usma_universe");

        storiesCollection =
            db.collection("stories");


        console.log(
            "MongoDB connected successfully."
        );


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

        message:
            "USMAPP Backend is running."

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
// STORIES — SUBMIT
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
                    "First name, last name and story are required."

            });

        }


        const newStory = {

            firstName:
                String(firstName).trim(),

            lastName:
                String(lastName).trim(),

            story:
                String(story).trim(),

            status:
                "PENDING",

            submittedAt:
                new Date()

        };


        const result =
            await storiesCollection.insertOne(
                newStory
            );


        console.log(
            "NEW USMA STORY:",
            result.insertedId
        );


        res.status(201).json({

            success: true,

            message:
                "Your story has been submitted successfully.",

            story: {

                _id:
                    result.insertedId,

                ...newStory

            }

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


// =========================================
// STORIES — PENDING
// =========================================

app.get(
    "/api/stories/pending",
    async (req, res) => {

        try {

            const stories =
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

                stories

            });


        } catch (error) {

            console.error(
                "Pending stories error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to load pending stories."

            });

        }

    }
);


// =========================================
// STORIES — APPROVED
// =========================================

app.get(
    "/api/stories/approved",
    async (req, res) => {

        try {

            const stories =
                await storiesCollection
                    .find({
                        status: "APPROVED"
                    })
                    .sort({
                        approvedAt: -1,
                        submittedAt: -1
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
                    "Failed to load approved stories."

            });

        }

    }
);


// =========================================
// STORIES — REJECTED
// =========================================

app.get(
    "/api/stories/rejected",
    async (req, res) => {

        try {

            const stories =
                await storiesCollection
                    .find({
                        status: "REJECTED"
                    })
                    .sort({
                        rejectedAt: -1,
                        submittedAt: -1
                    })
                    .toArray();


            res.json({

                success: true,

                stories

            });


        } catch (error) {

            console.error(
                "Rejected stories error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to load rejected stories."

            });

        }

    }
);


// =========================================
// STORIES — APPROVE
// =========================================

app.patch(
    "/api/stories/:id/approve",
    async (req, res) => {

        try {

            const id =
                req.params.id;


            if (!ObjectId.isValid(id)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid story ID."

                });

            }


            const result =
                await storiesCollection.updateOne(

                    {
                        _id:
                            new ObjectId(id)
                    },

                    {
                        $set: {

                            status:
                                "APPROVED",

                            approvedAt:
                                new Date()

                        },

                        $unset: {

                            rejectedAt: ""

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
                    "Failed to approve story."

            });

        }

    }
);


// =========================================
// STORIES — REJECT
// =========================================

app.patch(
    "/api/stories/:id/reject",
    async (req, res) => {

        try {

            const id =
                req.params.id;


            if (!ObjectId.isValid(id)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid story ID."

                });

            }


            const result =
                await storiesCollection.updateOne(

                    {
                        _id:
                            new ObjectId(id)
                    },

                    {
                        $set: {

                            status:
                                "REJECTED",

                            rejectedAt:
                                new Date()

                        },

                        $unset: {

                            approvedAt: ""

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
                    "Failed to reject story."

            });

        }

    }
);


// =========================================
// STORIES — DELETE
// =========================================

app.delete(
    "/api/stories/:id",
    async (req, res) => {

        try {

            const id =
                req.params.id;


            if (!ObjectId.isValid(id)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid story ID."

                });

            }


            const result =
                await storiesCollection.deleteOne({

                    _id:
                        new ObjectId(id)

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
                    "Failed to delete story."

            });

        }

    }
);


// =========================================
// VERIFICATION
// =========================================

app.post(
    "/api/verification",
    (req, res) => {

        try {

            const {
                fullName,
                birthDate,
                wilaya,
                phone,
                supportingSince,
                stand,
                profilePhoto,
                identityDocument
            } = req.body;


            if (
                !fullName ||
                !birthDate ||
                !wilaya ||
                !phone ||
                !profilePhoto ||
                !identityDocument
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Missing required information."

                });

            }


            const applicationId =
                "USMA-" +
                Date.now()
                    .toString()
                    .slice(-6);


            const application = {

                id:
                    applicationId,

                fullName,

                birthDate,

                wilaya,

                phone,

                supportingSince,

                stand,

                profilePhoto,

                identityDocument,

                status:
                    "PENDING",

                submittedAt:
                    new Date().toISOString()

            };


            console.log(
                "================================="
            );

            console.log(
                "NEW USMAPP APPLICATION"
            );

            console.log(application);

            console.log(
                "================================="
            );


            res.status(201).json({

                success: true,

                message:
                    "Verification submitted successfully.",

                application

            });


        } catch (error) {

            console.error(error);


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

    await connectMongoDB();


    app.listen(
        PORT,
        () => {

            console.log(
                `USMAPP Backend is running on port ${PORT}`
            );

        }
    );

}


startServer();
