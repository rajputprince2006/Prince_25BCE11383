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
// AUTOMATICALLY END POLL
// ======================================

function endPollAutomatically(roomCode) {

    const room =
        rooms[roomCode];


    // Room does not exist

    if (!room) {

        return;

    }


    // Poll already ended

    if (room.ended) {

        return;

    }


    // Mark poll as ended

    room.ended =
        true;


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


    // Find winner

    let winnerIndex =
        -1;


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
    // to admin and participants

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
        `Poll automatically ended: ${roomCode}`
    );

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


                // Make sure code is unique

                while (
                    rooms[roomCode]
                ) {

                    roomCode =
                        generateRoomCode();

                }


                // Create room

                rooms[roomCode] = {

                    adminId:
                        socket.id,

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


                // Put admin in room

                socket.join(
                    roomCode
                );


                // Send room information

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


                // Room doesn't exist

                if (!room) {

                    socket.emit(
                        "joinError",
                        "Room not found. Please check the room code."
                    );

                    return;

                }


                // Voting already started

                if (room.started) {

                    socket.emit(
                        "joinError",
                        "Voting has already started."
                    );

                    return;

                }


                // Poll ended

                if (room.ended) {

                    socket.emit(
                        "joinError",
                        "This poll has ended."
                    );

                    return;

                }


                // Empty name

                if (
                    participantName === ""
                ) {

                    socket.emit(
                        "joinError",
                        "Please enter your name."
                    );

                    return;

                }


                // Name too long

                if (
                    participantName.length > 30
                ) {

                    socket.emit(
                        "joinError",
                        "Name must be 30 characters or less."
                    );

                    return;

                }


                // Add participant

                if (
                    !room.participantIds.includes(
                        socket.id
                    )
                ) {

                    room.participantIds.push(
                        socket.id
                    );


                    room.participants++;


                    // Store participant name

                    if (
                        !room.participantNames
                    ) {

                        room.participantNames =
                            {};

                    }


                    room.participantNames[
                        socket.id
                    ] =
                        participantName;

                }


                // Join Socket.IO room

                socket.join(
                    roomCode
                );


                // Send room information

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


                // Update admin participant count

                io.to(
                    room.adminId
                ).emit(
                    "participantCount",
                    {

                        count:
                            room.participants

                    }
                );


                // Send participant list

                io.to(
                    room.adminId
                ).emit(
                    "participantList",
                    {

                        participants:
                            Object.values(
                                room.participantNames ||
                                {}
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


                // Room not found

                if (!room) {

                    return;

                }


                // Only admin can start

                if (
                    room.adminId !==
                    socket.id
                ) {

                    return;

                }


                // Already ended

                if (room.ended) {

                    return;

                }


                // Already started

                if (room.started) {

                    return;

                }


                // ==================================
                // TIMER DURATION
                // ==================================

                let duration =
                    Number(
                        data.duration
                    );


                // Default = 30 seconds

                if (
                    !Number.isFinite(
                        duration
                    ) ||
                    duration < 10
                ) {

                    duration =
                        30;

                }


                // Maximum = 300 seconds

                if (
                    duration > 300
                ) {

                    duration =
                        300;

                }


                // ==================================
                // START POLL
                // ==================================

                room.started =
                    true;


                room.timerDuration =
                    duration;


                room.timerEnd =
                    Date.now() +
                    duration * 1000;


                // ==================================
                // SEND POLL START EVENT
                // ==================================

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


                // ==================================
                // AUTOMATICALLY END POLL
                // ==================================

                setTimeout(
                    () => {

                        const currentRoom =
                            rooms[roomCode];


                        if (
                            !currentRoom
                        ) {

                            return;

                        }


                        if (
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
                    Number(
                        data.optionIndex
                    );


                const room =
                    rooms[roomCode];


                // Room not found

                if (!room) {

                    socket.emit(
                        "voteError",
                        "Room not found."
                    );

                    return;

                }


                // Voting hasn't started

                if (!room.started) {

                    socket.emit(
                        "voteError",
                        "Voting has not started yet."
                    );

                    return;

                }


                // Poll ended

                if (room.ended) {

                    socket.emit(
                        "voteError",
                        "This poll has ended."
                    );

                    return;

                }


                // Check participant

                if (
                    !room.participantIds.includes(
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
                    room.votedUsers.includes(
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
                    !Number.isInteger(
                        optionIndex
                    ) ||
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


                // ==================================
                // RECORD VOTE
                // ==================================

                room.votes[
                    optionIndex
                ]++;


                // Mark participant as voted

                room.votedUsers.push(
                    socket.id
                );


                // Send confirmation

                socket.emit(
                    "voteSubmitted",
                    {

                        success:
                            true

                    }
                );


                // ==================================
                // TOTAL VOTES
                // ==================================

                const totalVotes =
                    room.votes.reduce(
                        (
                            total,
                            vote
                        ) =>
                            total + vote,
                        0
                    );


                // ==================================
                // SEND LIVE RESULTS
                // ==================================

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
        // MANUAL END POLL
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


                // Only admin

                if (
                    room.adminId !==
                    socket.id
                ) {

                    return;

                }


                // Poll must have started

                if (!room.started) {

                    return;

                }


                // Already ended

                if (room.ended) {

                    return;

                }


                // ==================================
                // END POLL
                // ==================================

                room.ended =
                    true;


                // ==================================
                // TOTAL VOTES
                // ==================================

                const totalVotes =
                    room.votes.reduce(
                        (
                            total,
                            vote
                        ) =>
                            total + vote,
                        0
                    );


                // ==================================
                // FIND WINNER
                // ==================================

                let winnerIndex =
                    -1;


                if (
                    totalVotes > 0
                ) {

                    const highestVote =
                        Math.max(
                            ...room.votes
                        );


                    winnerIndex =
                        room.votes.indexOf(
                            highestVote
                        );

                }


                // ==================================
                // SEND FINAL RESULTS
                // ==================================

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
                    `Poll manually ended: ${roomCode}`
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


                    // Check participant

                    const participantIndex =
                        room.participantIds
                            .indexOf(
                                socket.id
                            );


                    if (
                        participantIndex !==
                        -1
                    ) {

                        // Remove participant

                        room.participantIds
                            .splice(
                                participantIndex,
                                1
                            );


                        room.participants--;


                        // Remove participant name

                        if (
                            room.participantNames
                        ) {

                            delete room
                                .participantNames[
                                    socket.id
                                ];

                        }


                        // Update count

                        io.to(
                            room.adminId
                        ).emit(
                            "participantCount",
                            {

                                count:
                                    room.participants

                            }
                        );


                        // Update participant list

                        io.to(
                            room.adminId
                        ).emit(
                            "participantList",
                            {

                                participants:
                                    Object.values(
                                        room.participantNames ||
                                        {}
                                    )

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