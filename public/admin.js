const socket = io();


// ======================================
// ELEMENTS
// ======================================

const pollForm =
    document.getElementById("pollForm");

const questionInput =
    document.getElementById("question");

const optionsContainer =
    document.getElementById("optionsContainer");

const addOptionButton =
    document.getElementById("addOption");

const createSection =
    document.getElementById("createSection");

const waitingSection =
    document.getElementById("waitingSection");

const liveSection =
    document.getElementById("liveSection");

const finalSection =
    document.getElementById("finalSection");

const roomCodeElement =
    document.getElementById("roomCode");

const copyRoomCodeButton =
    document.getElementById("copyRoomCode");

const participantCountElement =
    document.getElementById("participantCount");

const participantListElement =
    document.getElementById("participantList");

const previewQuestion =
    document.getElementById("previewQuestion");

const previewOptions =
    document.getElementById("previewOptions");

const timerDurationInput =
    document.getElementById("timerDuration");

const startPollButton =
    document.getElementById("startPoll");

const timerDisplay =
    document.getElementById("timerDisplay");

const liveQuestion =
    document.getElementById("liveQuestion");

const resultsContainer =
    document.getElementById("results");

const totalVotesElement =
    document.getElementById("totalVotes");

const endPollButton =
    document.getElementById("endPoll");

const finalQuestion =
    document.getElementById("finalQuestion");

const finalResults =
    document.getElementById("finalResults");

const finalTotalVotes =
    document.getElementById("finalTotalVotes");


// ======================================
// VARIABLES
// ======================================

let optionCount = 2;

let roomCode = "";

let timerInterval = null;

let currentOptions = [];


// ======================================
// ADD OPTION
// ======================================

addOptionButton.addEventListener(
    "click",
    () => {

        if (optionCount >= 6) {

            alert(
                "You can have a maximum of 6 options."
            );

            return;
        }


        optionCount++;


        const optionRow =
            document.createElement("div");

        optionRow.className =
            "option-row";


        optionRow.innerHTML = `

            <input
                type="text"
                class="option-input"
                placeholder="Option ${optionCount}"
                required
            >

            <button
                type="button"
                class="remove-option"
            >
                Remove
            </button>

        `;


        optionsContainer.appendChild(
            optionRow
        );


        updateRemoveButtons();

    }
);


// ======================================
// REMOVE OPTION
// ======================================

optionsContainer.addEventListener(
    "click",
    (event) => {

        if (
            !event.target.classList.contains(
                "remove-option"
            )
        ) {

            return;

        }


        if (optionCount <= 2) {

            alert(
                "You must have at least 2 options."
            );

            return;
        }


        event.target
            .parentElement
            .remove();


        optionCount--;


        updateOptionPlaceholders();

        updateRemoveButtons();

    }
);


// ======================================
// UPDATE PLACEHOLDERS
// ======================================

function updateOptionPlaceholders() {

    const inputs =
        document.querySelectorAll(
            ".option-input"
        );


    inputs.forEach(
        (input, index) => {

            input.placeholder =
                `Option ${index + 1}`;

        }
    );

}


// ======================================
// UPDATE REMOVE BUTTONS
// ======================================

function updateRemoveButtons() {

    const buttons =
        document.querySelectorAll(
            ".remove-option"
        );


    buttons.forEach(
        (button) => {

            if (optionCount <= 2) {

                button.style.display =
                    "none";

            } else {

                button.style.display =
                    "inline-block";

            }

        }
    );

}


// ======================================
// CREATE POLL
// ======================================

pollForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        const question =
            questionInput.value.trim();


        const optionInputs =
            document.querySelectorAll(
                ".option-input"
            );


        const options =
            Array.from(
                optionInputs
            )
                .map(
                    (input) =>
                        input.value.trim()
                )
                .filter(
                    (option) =>
                        option !== ""
                );


        // Validate question

        if (question === "") {

            alert(
                "Please enter a question."
            );

            return;
        }


        // Validate options

        if (options.length < 2) {

            alert(
                "Please enter at least 2 options."
            );

            return;
        }


        if (options.length > 6) {

            alert(
                "Maximum 6 options are allowed."
            );

            return;
        }


        // Check duplicate options

        const lowerCaseOptions =
            options.map(
                (option) =>
                    option.toLowerCase()
            );


        const uniqueOptions =
            new Set(
                lowerCaseOptions
            );


        if (
            uniqueOptions.size !==
            options.length
        ) {

            alert(
                "Please make sure all options are different."
            );

            return;
        }


        // Send to server

        socket.emit(
            "createPoll",
            {

                question:
                    question,

                options:
                    options

            }
        );


        console.log(
            "Creating poll..."
        );

    }
);


// ======================================
// POLL CREATED
// ======================================

socket.on(
    "pollCreated",
    (data) => {

        console.log(
            "Poll created:",
            data
        );


        roomCode =
            data.roomCode;


        currentOptions =
            data.options;


        // Hide creation section

        createSection.style.display =
            "none";


        // Show waiting room

        waitingSection.style.display =
            "block";


        // Show room code

        roomCodeElement.textContent =
            data.roomCode;


        // Show question

        previewQuestion.textContent =
            data.question;


        // Show options

        previewOptions.innerHTML =
            "";


        data.options.forEach(
            (option, index) => {

                const optionElement =
                    document.createElement(
                        "div"
                    );


                optionElement.className =
                    "preview-option";


                optionElement.textContent =
                    `${index + 1}. ${option}`;


                previewOptions.appendChild(
                    optionElement
                );

            }
        );


        // Reset participant count

        participantCountElement.textContent =
            "0";


        // Reset participant list

        participantListElement.innerHTML =
            `

            <p class="empty-participants">
                Waiting for participants to join...
            </p>

            `;


        console.log(
            "Waiting room ready."
        );

    }
);


// ======================================
// COPY ROOM CODE
// ======================================

copyRoomCodeButton.addEventListener(
    "click",
    async () => {

        if (!roomCode) {

            return;

        }


        try {

            await navigator.clipboard.writeText(
                roomCode
            );


            copyRoomCodeButton.textContent =
                "Copied!";


            setTimeout(
                () => {

                    copyRoomCodeButton.textContent =
                        "Copy Room Code";

                },
                1500
            );


        } catch (error) {

            alert(
                `Room Code: ${roomCode}`
            );

        }

    }
);


// ======================================
// PARTICIPANT COUNT
// ======================================

socket.on(
    "participantCount",
    (data) => {

        console.log(
            "Participant count:",
            data.count
        );


        participantCountElement.textContent =
            data.count;

    }
);


// ======================================
// PARTICIPANT LIST
// ======================================

socket.on(
    "participantList",
    (data) => {

        console.log(
            "Participant list:",
            data.participants
        );


        participantListElement.innerHTML =
            "";


        if (
            !data.participants ||
            data.participants.length === 0
        ) {

            participantListElement.innerHTML =
                `

                <p class="empty-participants">
                    Waiting for participants to join...
                </p>

                `;

            return;
        }


        data.participants.forEach(
            (name, index) => {

                const participant =
                    document.createElement(
                        "div"
                    );


                participant.className =
                    "participant-item";


                participant.innerHTML =
                    `

                    <span class="participant-number">
                        ${index + 1}
                    </span>

                    <span class="participant-name">
                        ${escapeHtml(name)}
                    </span>

                    `;


                participantListElement.appendChild(
                    participant
                );

            }
        );

    }
);


// ======================================
// ESCAPE HTML
// ======================================

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


// ======================================
// BEGIN VOTING
// ======================================

startPollButton.addEventListener(
    "click",
    () => {

        if (!roomCode) {

            alert(
                "Room is not ready."
            );

            return;
        }


        let duration =
            Number(
                timerDurationInput.value
            );


        if (
            !Number.isFinite(
                duration
            )
        ) {

            duration =
                30;

        }


        if (duration < 10) {

            alert(
                "Voting time must be at least 10 seconds."
            );

            return;

        }


        if (duration > 300) {

            alert(
                "Voting time cannot exceed 300 seconds."
            );

            return;

        }


        startPollButton.disabled =
            true;


        socket.emit(
            "startPoll",
            {

                roomCode:
                    roomCode,

                duration:
                    duration

            }
        );


        console.log(
            "Starting poll:",
            duration,
            "seconds"
        );

    }
);


// ======================================
// POLL STARTED
// ======================================

socket.on(
    "pollStarted",
    (data) => {

        console.log(
            "Poll started:",
            data
        );


        // Hide waiting room

        waitingSection.style.display =
            "none";


        // Show live section

        liveSection.style.display =
            "block";


        // Set question

        liveQuestion.textContent =
            data.question;


        // Create results

        createResults(
            data.options
        );


        // Start countdown

        startCountdown(
            data.duration
        );

    }
);


// ======================================
// CREATE LIVE RESULTS
// ======================================

function createResults(options) {

    resultsContainer.innerHTML =
        "";


    options.forEach(
        (option, index) => {

            const resultItem =
                document.createElement(
                    "div"
                );


            resultItem.className =
                "result-item";


            resultItem.innerHTML =
                `

                <div class="result-header">

                    <span>
                        ${escapeHtml(option)}
                    </span>

                    <strong
                        id="vote-${index}"
                    >
                        0
                    </strong>

                </div>

                <div class="bar-background">

                    <div
                        class="bar"
                        id="bar-${index}"
                        style="width: 0%;"
                    ></div>

                </div>

                `;


            resultsContainer.appendChild(
                resultItem
            );

        }
    );


    totalVotesElement.textContent =
        "0";

}


// ======================================
// UPDATE LIVE RESULTS
// ======================================

socket.on(
    "resultsUpdated",
    (data) => {

        console.log(
            "Results updated:",
            data
        );


        totalVotesElement.textContent =
            data.totalVotes;


        data.votes.forEach(
            (vote, index) => {

                const voteCount =
                    document.getElementById(
                        `vote-${index}`
                    );


                const voteBar =
                    document.getElementById(
                        `bar-${index}`
                    );


                if (voteCount) {

                    voteCount.textContent =
                        vote;

                }


                if (voteBar) {

                    let percentage =
                        0;


                    if (
                        data.totalVotes > 0
                    ) {

                        percentage =
                            (
                                vote /
                                data.totalVotes
                            ) * 100;

                    }


                    voteBar.style.width =
                        `${percentage}%`;

                }

            }
        );

    }
);


// ======================================
// COUNTDOWN TIMER
// ======================================

function startCountdown(seconds) {

    clearInterval(
        timerInterval
    );


    let remaining =
        Number(seconds);


    if (
        !Number.isFinite(
            remaining
        )
    ) {

        remaining =
            30;

    }


    function updateTimer() {

        const minutes =
            Math.floor(
                remaining / 60
            );


        const secondsLeft =
            remaining % 60;


        timerDisplay.textContent =
            `${String(minutes).padStart(2, "0")}:${String(secondsLeft).padStart(2, "0")}`;


        if (
            remaining <= 10
        ) {

            timerDisplay.classList.add(
                "danger"
            );


            timerDisplay.classList.remove(
                "warning"
            );

        } else if (
            remaining <= 20
        ) {

            timerDisplay.classList.add(
                "warning"
            );


            timerDisplay.classList.remove(
                "danger"
            );

        } else {

            timerDisplay.classList.remove(
                "warning",
                "danger"
            );

        }


        if (
            remaining <= 0
        ) {

            clearInterval(
                timerInterval
            );


            timerDisplay.textContent =
                "00:00";


            return;

        }


        remaining--;

    }


    updateTimer();


    timerInterval =
        setInterval(
            updateTimer,
            1000
        );

}


// ======================================
// END POLL BUTTON
// ======================================

endPollButton.addEventListener(
    "click",
    () => {

        if (!roomCode) {

            return;

        }


        const confirmation =
            confirm(
                "Are you sure you want to end the poll?"
            );


        if (!confirmation) {

            return;

        }


        socket.emit(
            "endPoll",
            {

                roomCode:
                    roomCode

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


        // Stop timer

        clearInterval(
            timerInterval
        );


        timerDisplay.textContent =
            "00:00";


        timerDisplay.classList.remove(
            "warning",
            "danger"
        );


        // Hide live section

        liveSection.style.display =
            "none";


        // Show final section

        finalSection.style.display =
            "block";


        // Set final question

        finalQuestion.textContent =
            data.question;


        // Set total votes

        finalTotalVotes.textContent =
            data.totalVotes;


        // Create final results

        finalResults.innerHTML =
            "";


        data.options.forEach(
            (option, index) => {

                const resultItem =
                    document.createElement(
                        "div"
                    );


                resultItem.className =
                    "result-item";


                if (
                    index ===
                    data.winnerIndex &&
                    data.totalVotes > 0
                ) {

                    resultItem.classList.add(
                        "winner"
                    );

                }


                let percentage =
                    0;


                if (
                    data.totalVotes > 0
                ) {

                    percentage =
                        (
                            data.votes[index] /
                            data.totalVotes
                        ) * 100;

                }


                resultItem.innerHTML =
                    `

                    <div class="result-header">

                        <span>
                            ${escapeHtml(option)}
                        </span>

                        <strong>
                            ${data.votes[index]}
                        </strong>

                    </div>

                    <div class="bar-background">

                        <div
                            class="bar"
                            style="width: ${percentage}%;"
                        ></div>

                    </div>

                    `;


                if (
                    index ===
                    data.winnerIndex &&
                    data.totalVotes > 0
                ) {

                    const winnerText =
                        document.createElement(
                            "div"
                        );


                    winnerText.className =
                        "winner-label";


                    winnerText.textContent =
                        "Winner";


                    resultItem.appendChild(
                        winnerText
                    );

                }


                finalResults.appendChild(
                    resultItem
                );

            }
        );


        console.log(
            "Final results displayed."
        );

    }
);


// ======================================
// SOCKET CONNECTION
// ======================================

socket.on(
    "connect",
    () => {

        console.log(
            "Connected to server:",
            socket.id
        );

    }
);


// ======================================
// SOCKET DISCONNECT
// ======================================

socket.on(
    "disconnect",
    () => {

        console.log(
            "Disconnected from server."
        );

    }
);


// ======================================
// INITIAL SETUP
// ======================================

updateRemoveButtons();

console.log(
    "Admin JavaScript loaded successfully."
);