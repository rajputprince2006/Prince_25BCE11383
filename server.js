const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();

const server =
    http.createServer(app);

const io =
    new Server(server);

const PORT = 3000;


// ======================================
// STATIC FILES
// ======================================

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);


// ======================================
// API STATUS
// ======================================

app.get(
    "/api/status",
    (req, res) => {

        res.json({

            status:
                "Server is running",

            project:
                "Live Polling Quiz"

        });

    }
);


// ======================================
// ROOMS
// ======================================

const rooms = {};


// ======================================
// GENERATE ROOM CODE
// ======================================

function generateRoomCode() {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let code = "";


    for (
        let i = 0;
        i < 6;
        i++
    ) {

        code +=
            characters.charAt(
                Math.floor(
                    Math.random() *
                    characters.length
                )
            );

    }


    return code;
}


// ======================================
// SOCKET CONNECTION
// ======================================

io.on(
    "connection",
    (socket) => {

        console.log(
            "User connected:",
            socket.id
        );


        // ==================================
        // CREATE POLL
        // ==================================

        socket.on(
            "createPoll",
            (pollData) => {

                let roomCode =
                    generateRoomCode();


                while (
                    rooms[roomCode]
                ) {

                    roomCode =
                        generateRoomCode();

                }


                rooms[roomCode] = {
                    adminId: socket.id,

                    question:
                        pollData.question,

                    options:
                        pollData.options,

                    participants:
                        0,

                    participantIds:
                        [],

                    participantNames:
                        {},

                    votedUsers:
                        [],

                    started:
                        false,

                    ended:
                        false,

                    votes:
                        pollData.options.map(
                            () => 0
                        )
                };


                socket.join(
                    roomCode
                );


                socket.emit(
                    "pollCreated",
                    {

                        roomCode:
                            roomCode,

                        question:
                            pollData.question,

                        options:
                            pollData.options

                    }
                );


                console.log(
                    "Poll created:",
                    roomCode
                );

            }
        );


        // ==================================
        // JOIN ROOM
        // ==================================

        socket.on(
            "joinRoom",
            (data) => {

                const roomCode =
                    data.roomCode
                        .trim()
                        .toUpperCase();

                const participantName =
                    data.participantName
                        ? data.participantName.trim()
                        : "";

                const room =
                    rooms[roomCode];

                if (!room) {

                    socket.emit(
                        "joinError",
                        "Room not found. Please check the room code."
                    );

                    return;
                }

                if (room.started) {

                    socket.emit(
                        "joinError",
                        "Voting has already started."
                    );

                    return;
                }

                if (room.ended) {

                    socket.emit(
                        "joinError",
                        "This poll has ended."
                    );

                    return;
                }

                if (participantName === "") {

                    socket.emit(
                        "joinError",
                        "Please enter your name."
                    );

                    return;
                }

                if (participantName.length > 30) {

                    socket.emit(
                        "joinError",
                        "Name must be 30 characters or less."
                    );

                    return;
                }


                // Add participant
                if (
                    !room.participantIds
                        .includes(socket.id)
                ) {

                    room.participantIds.push(
                        socket.id
                    );

                    room.participants++;

                    // Store participant name
                    if (!room.participantNames) {
                        room.participantNames = {};
                    }

                    room.participantNames[
                        socket.id
                    ] = participantName;
                }


                socket.join(
                    roomCode
                );


                // Send room information to participant
                socket.emit(
                    "roomJoined",
                    {
                        roomCode:
                            roomCode,

                        question:
                            room.question,

                        options:
                            room.options,

                        participantName:
                            participantName
                    }
                );


                // Update admin
                io.to(
                    room.adminId
                ).emit(
                    "participantCount",
                    {
                        count:
                            room.participants
                    }
                );


                // Send participant list to admin
                io.to(
                    room.adminId
                ).emit(
                    "participantList",
                    {
                        participants:
                            Object.values(
                                room.participantNames || {}
                            )
                    }
                );


                console.log(
                    `Participant joined ${roomCode}: ${participantName}. Total: ${room.participants}`
                );

            }
        );


        // ==================================
        // START POLL
        // ==================================

        socket.on(
            "startPoll",
            (data) => {

                const roomCode =
                    data.roomCode;

                const room =
                    rooms[roomCode];

                if (!room) {
                    return;
                }

                if (
                    room.adminId !==
                    socket.id
                ) {
                    return;
                }

                if (room.ended) {
                    return;
                }

                if (room.started) {
                    return;
                }


                // Get timer duration
                let duration =
                    Number(data.duration);

                // Default to 30 seconds
                if (
                    !Number.isFinite(duration) ||
                    duration < 10
                ) {
                    duration = 30;
                }

                // Maximum 5 minutes
                if (duration > 300) {
                    duration = 300;
                }


                room.started = true;

                room.timerDuration =
                    duration;

                room.timerEnd =
                    Date.now() +
                    duration * 1000;


                // Tell everyone voting has started
                io.to(
                    roomCode
                ).emit(
                    "pollStarted",
                    {
                        question:
                            room.question,

                        options:
                            room.options,

                        duration:
                            duration,

                        timerEnd:
                            room.timerEnd
                    }
                );


                console.log(
                    `Poll started: ${roomCode} - ${duration} seconds`
                );


                // Automatically end poll
                setTimeout(
                    () => {

                        const currentRoom =
                            rooms[roomCode];

                        if (
                            !currentRoom ||
                            currentRoom.ended
                        ) {
                            return;
                        }

                        endPollAutomatically(
                            roomCode
                        );

                    },
                    duration * 1000
                );

            }
        );

        // ==================================
        // SUBMIT VOTE
        // ==================================

        socket.on(
            "submitVote",
            (data) => {

                const roomCode =
                    data.roomCode;

                const optionIndex =
                    data.optionIndex;


                const room =
                    rooms[roomCode];


                if (!room) {

                    socket.emit(
                        "voteError",
                        "Room not found."
                    );

                    return;
                }


                if (!room.started) {

                    socket.emit(
                        "voteError",
                        "Voting has not started yet."
                    );

                    return;
                }


                if (room.ended) {

                    socket.emit(
                        "voteError",
                        "This poll has ended."
                    );

                    return;
                }


                // Check participant
                if (
                    !room.participantIds
                        .includes(
                            socket.id
                        )
                ) {

                    socket.emit(
                        "voteError",
                        "You are not a participant in this room."
                    );

                    return;
                }


                // Prevent double voting
                if (
                    room.votedUsers
                        .includes(
                            socket.id
                        )
                ) {

                    socket.emit(
                        "voteError",
                        "You have already voted."
                    );

                    return;
                }


                // Check option
                if (
                    optionIndex < 0 ||
                    optionIndex >=
                    room.options.length
                ) {

                    socket.emit(
                        "voteError",
                        "Invalid option."
                    );

                    return;
                }


                // Record vote
                room.votes[
                    optionIndex
                ]++;


                // Mark participant as voted
                room.votedUsers.push(
                    socket.id
                );


                // Confirmation
                socket.emit(
                    "voteSubmitted",
                    {
                        success:
                            true
                    }
                );


                // Calculate total votes
                const totalVotes =
                    room.votes.reduce(
                        (
                            total,
                            vote
                        ) =>
                            total + vote,
                        0
                    );


                // Send live results
                io.to(
                    roomCode
                ).emit(
                    "resultsUpdated",
                    {

                        votes:
                            room.votes,

                        totalVotes:
                            totalVotes

                    }
                );


                console.log(
                    `Vote received in ${roomCode}:`,
                    room.votes
                );

            }
        );


        // ==================================
        // END POLL
        // ==================================

        socket.on(
            "endPoll",
            (data) => {

                const roomCode =
                    data.roomCode;


                const room =
                    rooms[roomCode];


                if (!room) {
                    return;
                }


                // Only admin can end
                if (
                    room.adminId !==
                    socket.id
                ) {
                    return;
                }


                if (!room.started) {
                    return;
                }


                if (room.ended) {
                    return;
                }


                room.ended =
                    true;


                const totalVotes =
                    room.votes.reduce(
                        (
                            total,
                            vote
                        ) =>
                            total + vote,
                        0
                    );


                let winnerIndex =
                    -1;


                // Only select winner if
                // there are votes
                if (totalVotes > 0) {

                    const highestVote =
                        Math.max(
                            ...room.votes
                        );


                    winnerIndex =
                        room.votes.indexOf(
                            highestVote
                        );

                }


                // Send final results
                io.to(
                    roomCode
                ).emit(
                    "pollEnded",
                    {

                        question:
                            room.question,

                        options:
                            room.options,

                        votes:
                            room.votes,

                        totalVotes:
                            totalVotes,

                        winnerIndex:
                            winnerIndex

                    }
                );


                console.log(
                    `Poll ended: ${roomCode}`
                );

            }
        );


        // ==================================
        // DISCONNECT
        // ==================================

        socket.on(
            "disconnect",
            () => {

                console.log(
                    "User disconnected:",
                    socket.id
                );


                for (
                    const roomCode
                    in rooms
                ) {

                    const room =
                        rooms[roomCode];


                    // Remove participant
                    const participantIndex =
                        room.participantIds
                            .indexOf(
                                socket.id
                            );


                    if (
                        participantIndex !==
                        -1
                    ) {

                        room.participantIds
                            .splice(
                                participantIndex,
                                1
                            );


                        room.participants--;


                        io.to(
                            room.adminId
                        ).emit(
                            "participantCount",
                            {

                                count:
                                    room.participants

                            }
                        );

                    }

                }

            }
        );

    }
);


// ======================================
// START SERVER
// ======================================

server.listen(
    PORT,
    () => {

        console.log(
            `Server running at http://localhost:${PORT}`
        );

    }
);