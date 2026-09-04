const socket = io();


// ======================================
// HTML ELEMENTS
// ======================================

const joinSection =
    document.getElementById("joinSection");

const waitingSection =
    document.getElementById("waitingSection");

const votingSection =
    document.getElementById("votingSection");

const resultsSection =
    document.getElementById("resultsSection");

const joinForm =
    document.getElementById("joinForm");

const participantNameInput =
    document.getElementById("participantName");

const roomCodeInput =
    document.getElementById("roomCode");

const displayParticipantName =
    document.getElementById("displayParticipantName");

const votingParticipantName =
    document.getElementById("votingParticipantName");

const joinedRoomCode =
    document.getElementById("joinedRoomCode");

const question =
    document.getElementById("question");

const votingOptions =
    document.getElementById("votingOptions");

const voteMessage =
    document.getElementById("voteMessage");

const participantResults =
    document.getElementById("participantResults");

const participantTotalVotes =
    document.getElementById("participantTotalVotes");


// ======================================
// TIMER
// ======================================

let participantTimer = null;

let participantTimerInterval = null;


// ======================================
// PARTICIPANT DATA
// ======================================

let currentRoomCode = "";

let participantName = "";

let hasVoted = false;


// ======================================
// JOIN ROOM
// ======================================

joinForm.addEventListener("submit", (event) => {

    event.preventDefault();


    participantName =
        participantNameInput.value.trim();


    const roomCode =
        roomCodeInput.value
            .trim()
            .toUpperCase();


    // Check participant name

    if (participantName === "") {

        alert(
            "Please enter your name."
        );

        return;
    }


    // Check name length

    if (participantName.length > 30) {

        alert(
            "Name must be 30 characters or less."
        );

        return;
    }


    // Check room code

    if (roomCode.length !== 6) {

        alert(
            "Please enter a 6-character room code."
        );

        return;
    }


    currentRoomCode =
        roomCode;


    console.log(
        "Joining room:",
        roomCode
    );


    // Send request to server

    socket.emit(
        "joinRoom",
        {
            roomCode:
                roomCode,

            participantName:
                participantName
        }
    );

});


// ======================================
// SUCCESSFULLY JOINED
// ======================================

socket.on("roomJoined", (data) => {

    console.log(
        "Room joined successfully:",
        data
    );


    currentRoomCode =
        data.roomCode;


    // Display room code

    if (joinedRoomCode) {

        joinedRoomCode.textContent =
            data.roomCode;

    }


    // Display participant name

    if (displayParticipantName) {

        displayParticipantName.textContent =
            participantName;

    }


    if (votingParticipantName) {

        votingParticipantName.textContent =
            participantName;

    }


    // Show waiting section

    joinSection.style.display =
        "none";

    waitingSection.style.display =
        "block";


    // Hide voting and results

    votingSection.style.display =
        "none";

    resultsSection.style.display =
        "none";

});


// ======================================
// POLL STARTED
// ======================================

socket.on("pollStarted", (data) => {

    console.log(
        "Poll started:",
        data
    );


    hasVoted = false;


    // ==================================
    // SHOW VOTING SECTION FIRST
    // ==================================

    waitingSection.style.display =
        "none";

    votingSection.style.display =
        "block";

    resultsSection.style.display =
        "block";


    // ==================================
    // START TIMER
    // ==================================

    startParticipantCountdown(
        data.duration
    );


    // ==================================
    // QUESTION
    // ==================================

    question.textContent =
        data.question;


    // ==================================
    // CLEAR OLD OPTIONS
    // ==================================

    votingOptions.innerHTML = "";


    // ==================================
    // RESET MESSAGE
    // ==================================

    voteMessage.textContent =
        "Choose one option to vote.";


    // ==================================
    // CREATE VOTING BUTTONS
    // ==================================

    data.options.forEach(
        (option, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.textContent =
                option;


            button.className =
                "vote-button";


            button.disabled =
                false;


            button.addEventListener(
                "click",
                () => {

                    vote(index);

                }
            );


            votingOptions.appendChild(
                button
            );

        }
    );


    // ==================================
    // CREATE LIVE RESULTS
    // ==================================

    createParticipantResults(
        data.options
    );

});


// ======================================
// CREATE PARTICIPANT RESULTS
// ======================================

function createParticipantResults(
    options
) {

    participantResults.innerHTML =
        "";


    options.forEach(
        (option, index) => {

            const resultItem =
                document.createElement(
                    "div"
                );


            resultItem.className =
                "result-item";


            resultItem.innerHTML = `

                <div class="result-header">

                    <span>
                        ${option}
                    </span>

                    <strong
                        id="participant-vote-${index}"
                    >
                        0
                    </strong>

                </div>

                <div class="bar-background">

                    <div
                        class="bar"
                        id="participant-bar-${index}"
                        style="width: 0%;"
                    ></div>

                </div>

            `;


            participantResults.appendChild(
                resultItem
            );

        }
    );

}


// ======================================
// VOTE
// ======================================

function vote(optionIndex) {

    // Prevent double voting

    if (hasVoted) {

        return;

    }


    console.log(
        "Submitting vote:",
        optionIndex
    );


    // Disable buttons immediately

    const buttons =
        document.querySelectorAll(
            ".vote-button"
        );


    buttons.forEach(
        (button) => {

            button.disabled =
                true;

        }
    );


    // Send vote

    socket.emit(
        "submitVote",
        {
            roomCode:
                currentRoomCode,

            optionIndex:
                optionIndex
        }
    );

}


// ======================================
// VOTE SUBMITTED
// ======================================

socket.on(
    "voteSubmitted",
    () => {

        hasVoted =
            true;


        voteMessage.textContent =
            "Vote submitted successfully!";

    }
);


// ======================================
// VOTE ERROR
// ======================================

socket.on(
    "voteError",
    (messageText) => {

        console.log(
            "Vote error:",
            messageText
        );


        voteMessage.textContent =
            messageText;


        // Re-enable buttons if
        // vote was rejected

        if (!hasVoted) {

            const buttons =
                document.querySelectorAll(
                    ".vote-button"
                );


            buttons.forEach(
                (button) => {

                    button.disabled =
                        false;

                }
            );

        }

    }
);


// ======================================
// LIVE RESULTS
// ======================================

socket.on(
    "resultsUpdated",
    (data) => {

        console.log(
            "Results updated:",
            data
        );


        participantTotalVotes.textContent =
            data.totalVotes;


        data.votes.forEach(
            (vote, index) => {

                const voteCount =
                    document.getElementById(
                        `participant-vote-${index}`
                    );


                const voteBar =
                    document.getElementById(
                        `participant-bar-${index}`
                    );


                // Update number

                if (voteCount) {

                    voteCount.textContent =
                        vote;

                }


                // Update bar

                if (voteBar) {

                    const percentage =
                        data.totalVotes === 0
                            ? 0
                            : (
                                vote /
                                data.totalVotes
                            ) * 100;


                    voteBar.style.width =
                        `${percentage}%`;

                }

            }
        );

    }
);


// ======================================
// POLL ENDED
// ======================================

socket.on(
    "pollEnded",
    (data) => {

        console.log(
            "Poll ended:",
            data
        );


        // ==================================
        // STOP TIMER
        // ==================================

        clearInterval(
            participantTimerInterval
        );


        if (participantTimer) {

            participantTimer.textContent =
                "00:00";


            participantTimer.classList.remove(
                "warning",
                "danger"
            );

        }


        // ==================================
        // DISABLE VOTING
        // ==================================

        const buttons =
            document.querySelectorAll(
                ".vote-button"
            );


        buttons.forEach(
            (button) => {

                button.disabled =
                    true;

            }
        );


        // ==================================
        // TOTAL VOTES
        // ==================================

        participantTotalVotes.textContent =
            data.totalVotes;


        // ==================================
        // FINAL RESULTS
        // ==================================

        data.votes.forEach(
            (vote, index) => {

                const voteCount =
                    document.getElementById(
                        `participant-vote-${index}`
                    );


                const voteBar =
                    document.getElementById(
                        `participant-bar-${index}`
                    );


                // Update vote count

                if (voteCount) {

                    voteCount.textContent =
                        vote;

                }


                // Update bar

                if (voteBar) {

                    const percentage =
                        data.totalVotes === 0
                            ? 0
                            : (
                                vote /
                                data.totalVotes
                            ) * 100;


                    voteBar.style.width =
                        `${percentage}%`;

                }


                // ==================================
                // WINNER
                // ==================================

                if (
                    index === data.winnerIndex &&
                    data.totalVotes > 0 &&
                    voteBar
                ) {

                    const resultItem =
                        voteBar.parentElement
                            .parentElement;


                    resultItem.style.fontWeight =
                        "bold";


                    resultItem.style.border =
                        "2px solid #16a34a";


                    resultItem.style.padding =
                        "10px";


                    resultItem.style.borderRadius =
                        "8px";


                    const winnerLabel =
                        document.createElement(
                            "p"
                        );


                    winnerLabel.textContent =
                        "Winner";


                    winnerLabel.style.marginTop =
                        "5px";


                    winnerLabel.style.color =
                        "#16a34a";


                    resultItem.appendChild(
                        winnerLabel
                    );

                }

            }
        );


        // ==================================
        // END MESSAGE
        // ==================================

        voteMessage.innerHTML = `
            <h3>Poll Ended</h3>
            <p>Final results are shown above.</p>
        `;

    }
);


// ======================================
// JOIN ERROR
// ======================================

socket.on(
    "joinError",
    (messageText) => {

        console.log(
            "Join error:",
            messageText
        );


        alert(
            messageText
        );

    }
);


// ======================================
// PARTICIPANT TIMER
// ======================================

function startParticipantCountdown(
    seconds
) {

    console.log(
        "Starting participant timer:",
        seconds
    );


    // ==================================
    // FIND TIMER
    // ==================================

    participantTimer =
        document.getElementById(
            "participantTimer"
        );


    // ==================================
    // CREATE TIMER IF MISSING
    // ==================================

    if (!participantTimer) {

        console.log(
            "Timer not found. Creating timer."
        );


        participantTimer =
            document.createElement(
                "div"
            );


        participantTimer.id =
            "participantTimer";


        // Put timer at top of voting section

        votingSection.insertBefore(
            participantTimer,
            votingSection.firstChild
        );

    }


    // ==================================
    // FORCE TIMER VISIBILITY
    // ==================================

    participantTimer.style.display =
        "block";

    participantTimer.style.visibility =
        "visible";

    participantTimer.style.opacity =
        "1";

    participantTimer.style.textAlign =
        "center";

    participantTimer.style.fontSize =
        "40px";

    participantTimer.style.fontWeight =
        "800";

    participantTimer.style.margin =
        "20px 0";

    participantTimer.style.padding =
        "10px";

    participantTimer.style.color =
        "#a78bfa";

    participantTimer.style.letterSpacing =
        "3px";

    participantTimer.style.minHeight =
        "50px";


    // ==================================
    // STOP OLD TIMER
    // ==================================

    clearInterval(
        participantTimerInterval
    );


    // ==================================
    // GET DURATION
    // ==================================

    let remaining =
        Number(seconds);


    // Safety check

    if (
        !Number.isFinite(
            remaining
        ) ||
        remaining < 0
    ) {

        remaining =
            30;

    }


    // ==================================
    // TIMER UPDATE
    // ==================================

    function updateTimer() {

        if (!participantTimer) {

            clearInterval(
                participantTimerInterval
            );

            return;

        }


        const minutes =
            Math.floor(
                remaining / 60
            );


        const secondsLeft =
            remaining % 60;


        // Display timer

        participantTimer.textContent =
            `${String(minutes).padStart(2, "0")}:${String(secondsLeft).padStart(2, "0")}`;


        // ==================================
        // LAST 10 SECONDS
        // ==================================

        if (remaining <= 10) {

            participantTimer.style.color =
                "#ef4444";


            participantTimer.classList.add(
                "danger"
            );


            participantTimer.classList.remove(
                "warning"
            );

        }


        // ==================================
        // LAST 20 SECONDS
        // ==================================

        else if (remaining <= 20) {

            participantTimer.style.color =
                "#f59e0b";


            participantTimer.classList.add(
                "warning"
            );


            participantTimer.classList.remove(
                "danger"
            );

        }


        // ==================================
        // NORMAL
        // ==================================

        else {

            participantTimer.style.color =
                "#a78bfa";


            participantTimer.classList.remove(
                "warning",
                "danger"
            );

        }


        // ==================================
        // TIMER FINISHED
        // ==================================

        if (remaining <= 0) {

            clearInterval(
                participantTimerInterval
            );


            participantTimer.textContent =
                "00:00";


            return;

        }


        remaining--;

    }


    // ==================================
    // START TIMER IMMEDIATELY
    // ==================================

    updateTimer();


    // ==================================
    // UPDATE EVERY SECOND
    // ==================================

    participantTimerInterval =
        setInterval(
            updateTimer,
            1000
        );

}