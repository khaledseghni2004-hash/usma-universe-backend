const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: "*"
}));

app.use(express.json({
    limit: "10mb"
}));


// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "USMA Universe Backend is running."
    });

});


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        status: "online"
    });

});


// ==========================================
// TEMPORARY STORIES DATABASE
// ==========================================

let stories = [];


// ==========================================
// SUBMIT STORY
// ==========================================

app.post("/api/stories", (req, res) => {

    try {

        const {
            firstName,
            lastName,
            story
        } = req.body;


        // Check required information

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


        // Create story

        const newStory = {

            id:
                "VOICE-" +
                Date.now()
                    .toString()
                    .slice(-6),

            firstName:
                firstName.trim(),

            lastName:
                lastName.trim(),

            story:
                story.trim(),

            status:
                "PENDING",

            submittedAt:
                new Date().toISOString()

        };


        // Save story

        stories.push(newStory);


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

        console.error(error);

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

app.get("/api/stories/pending", (req, res) => {

    const pendingStories =
        stories.filter(
            story => story.status === "PENDING"
        );


    res.json({

        success: true,

        stories:
            pendingStories

    });

});


// ==========================================
// GET APPROVED STORIES
// ==========================================

app.get("/api/stories/approved", (req, res) => {

    const approvedStories =
        stories.filter(
            story => story.status === "APPROVED"
        );


    res.json({

        success: true,

        stories:
            approvedStories

    });

});


// ==========================================
// APPROVE STORY
// ==========================================

app.patch(
    "/api/stories/:id/approve",
    (req, res) => {

        const story =
            stories.find(
                item => item.id === req.params.id
            );


        if (!story) {

            return res.status(404).json({

                success: false,

                message:
                    "Story not found."

            });

        }


        story.status =
            "APPROVED";


        story.approvedAt =
            new Date().toISOString();


        res.json({

            success: true,

            message:
                "Story approved successfully.",

            story

        });

    }
);


// ==========================================
// REJECT STORY
// ==========================================

app.patch(
    "/api/stories/:id/reject",
    (req, res) => {

        const story =
            stories.find(
                item => item.id === req.params.id
            );


        if (!story) {

            return res.status(404).json({

                success: false,

                message:
                    "Story not found."

            });

        }


        story.status =
            "REJECTED";


        story.rejectedAt =
            new Date().toISOString();


        res.json({

            success: true,

            message:
                "Story rejected successfully.",

            story

        });

    }
);


// ==========================================
// DELETE STORY
// ==========================================

app.delete(
    "/api/stories/:id",
    (req, res) => {

        const index =
            stories.findIndex(
                item => item.id === req.params.id
            );


        if (index === -1) {

            return res.status(404).json({

                success: false,

                message:
                    "Story not found."

            });

        }


        stories.splice(index, 1);


        res.json({

            success: true,

            message:
                "Story deleted successfully."

        });

    }
);


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

    console.log(
        `USMA Universe Backend running on port ${PORT}`
    );

});
