const socket = io();


// ======================================
// GET HTML ELEMENTS
// ======================================

const optionsContainer =
    document.getElementById(
        "optionsContainer"
    );

const addOptionButton =
    document.getElementById(
        "addOption"
    );

const pollForm =
    document.getElementById(
        "pollForm"
    );

const message =
    document.getElementById(
        "message"
    );

const waitingRoom =
    document.getElementById(
        "waitingRoom"
    );

const roomCodeDisplay =
    document.getElementById(
        "roomCodeDisplay"
    );

const participantCount =
    document.getElementById(
        "participantCount"
    );

const startPollButton =
    document.getElementById(
        "startPoll"
    );

const results =
    document.getElementById(
        "results"
    );

const resultsQuestion =
    document.getElementById(
        "resultsQuestion"
    );

const resultsContainer =
    document.getElementById(
        "resultsContainer"
    );

const totalVotes =
    document.getElementById(
        "totalVotes"
    );

const endPollButton =
    document.getElementById(
        "endPoll"
    );


// ======================================
// VARIABLES
// ======================================

let optionCount = 2;

let currentRoomCode = "";

let currentOptions = [];


// ======================================
// ADD OPTION
// ======================================

addOptionButton.addEventListener(
    "click",
    () => {

        if (optionCount >= 6) {

            message.textContent =
                "Maximum 6 options allowed.";

            return;
        }


        optionCount++;


        const optionRow =
            document.createElement(
                "div"
            );


        optionRow.className =
            "option-row";


        optionRow.innerHTML = `

            <input
                type="text"
                class="option-input"
                placeholder="Option ${optionCount}"
                required
            >

        `;


        optionsContainer.appendChild(
            optionRow
        );


        message.textContent = "";

    }
);


// ======================================
// CREATE POLL
// ======================================

pollForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        const question =
            document
                .getElementById(
                    "question"
                )
                .value
                .trim();


        const optionInputs =
            document.querySelectorAll(
                ".option-input"
            );


        const options =
            Array.from(
                optionInputs
            )
                .map(
                    input =>
                        input.value.trim()
                )
                .filter(
                    option =>
                        option !== ""
                );


        if (question === "") {

            message.textContent =
                "Please enter a question.";

            return;
        }


        if (options.length < 2) {

            message.textContent =
                "Please provide at least 2 options.";

            return;
        }


        currentOptions =
            options;


        message.textContent =
            "Creating poll...";


        socket.emit(
            "createPoll",
            {

                question:
                    question,

                options:
                    options

            }
        );

    }
);


// ======================================
// POLL CREATED
// ======================================

socket.on(
    "pollCreated",
    (poll) => {

        currentRoomCode =
            poll.roomCode;

        currentOptions =
            poll.options;


        roomCodeDisplay.textContent =
            poll.roomCode;


        participantCount.textContent =
            "0";


        waitingRoom.style.display =
            "block";


        pollForm.style.display =
            "none";


        message.textContent =
            "Poll created successfully!";

    }
);


// ======================================
// PARTICIPANT COUNT
// ======================================

socket.on(
    "participantCount",
    (data) => {

        participantCount.textContent =
            data.count;

    }
);


// ======================================
// BEGIN VOTING
// ======================================

startPollButton.addEventListener(
    "click",
    () => {

        if (!currentRoomCode) {
            return;
        }


        socket.emit(
            "startPoll",
            {
                roomCode:
                    currentRoomCode
            }
        );


        startPollButton.disabled =
            true;


        startPollButton.textContent =
            "Voting Started";


        results.style.display =
            "block";


        resultsQuestion.textContent =
            "Live voting results";


        createResultBars();

    }
);


// ======================================
// CREATE RESULT BARS
// ======================================

function createResultBars() {

    resultsContainer.innerHTML =
        "";


    currentOptions.forEach(
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

}


// ======================================
// LIVE RESULTS
// ======================================

socket.on(
    "resultsUpdated",
    (data) => {

        totalVotes.textContent =
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
// END POLL
// ======================================

endPollButton.addEventListener(
    "click",
    () => {

        if (!currentRoomCode) {
            return;
        }


        socket.emit(
            "endPoll",
            {
                roomCode:
                    currentRoomCode
            }
        );


        endPollButton.disabled =
            true;


        endPollButton.textContent =
            "Poll Ended";

    }
);


// ======================================
// POLL ENDED
// ======================================

socket.on(
    "pollEnded",
    (data) => {

        resultsQuestion.textContent =
            "Final Results";


        totalVotes.textContent =
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


                // Highlight winner
                if (
                    index === data.winnerIndex &&
                    data.totalVotes > 0
                ) {

                    const resultItem =
                        voteBar
                            .parentElement
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


        endPollButton.disabled =
            true;


        endPollButton.textContent =
            "Poll Ended";


        startPollButton.disabled =
            true;

    }
);