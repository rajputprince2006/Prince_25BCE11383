const socket = io();

const joinSection = document.getElementById("joinSection");
const waitingSection = document.getElementById("waitingSection");
const votingSection = document.getElementById("votingSection");
const resultsSection = document.getElementById("resultsSection");

const joinForm = document.getElementById("joinForm");

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

let currentRoomCode = "";
let participantName = "";
let hasVoted = false;


// JOIN ROOM
joinForm.addEventListener("submit", (event) => {

    event.preventDefault();

    participantName =
        participantNameInput.value.trim();

    const roomCode =
        roomCodeInput.value
            .trim()
            .toUpperCase();

    if (participantName === "") {

        alert("Please enter your name.");

        return;
    }

    if (participantName.length > 30) {

        alert("Name must be 30 characters or less.");

        return;
    }

    if (roomCode.length !== 6) {

        alert(
            "Please enter a 6-character room code."
        );

        return;
    }

    currentRoomCode = roomCode;

    socket.emit("joinRoom", {
        roomCode: roomCode,
        participantName: participantName
    });

});


// SUCCESSFULLY JOINED
socket.on("roomJoined", (data) => {

    currentRoomCode =
        data.roomCode;

    joinedRoomCode.textContent =
        data.roomCode;

    if (displayParticipantName) {
        displayParticipantName.textContent =
            participantName;
    }

    if (votingParticipantName) {
        votingParticipantName.textContent =
            participantName;
    }

    joinSection.style.display =
        "none";

    waitingSection.style.display =
        "block";

});


// POLL STARTED
socket.on("pollStarted", (data) => {

    hasVoted = false;

    question.textContent =
        data.question;

    votingOptions.innerHTML = "";

    voteMessage.textContent =
        "Choose one option to vote.";

    data.options.forEach((option, index) => {

        const button =
            document.createElement("button");

        button.textContent =
            option;

        button.className =
            "vote-button";

        button.addEventListener(
            "click",
            () => {
                vote(index);
            }
        );

        votingOptions.appendChild(
            button
        );

    });

    waitingSection.style.display =
        "none";

    votingSection.style.display =
        "block";

    resultsSection.style.display =
        "block";

    createParticipantResults(
        data.options
    );

});


// CREATE RESULT BARS
function createParticipantResults(options) {

    participantResults.innerHTML = "";

    options.forEach((option, index) => {

        const resultItem =
            document.createElement("div");

        resultItem.className =
            "result-item";

        resultItem.innerHTML = `
            <div class="result-header">

                <span>${option}</span>

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

    });

}


// SUBMIT VOTE
function vote(optionIndex) {

    if (hasVoted) {
        return;
    }

    const buttons =
        document.querySelectorAll(
            ".vote-button"
        );

    buttons.forEach(button => {

        button.disabled = true;

    });

    socket.emit("submitVote", {

        roomCode:
            currentRoomCode,

        optionIndex:
            optionIndex

    });

}


// VOTE SUBMITTED
socket.on("voteSubmitted", () => {

    hasVoted = true;

    voteMessage.textContent =
        "Vote submitted successfully!";

});


// VOTE ERROR
socket.on("voteError", (messageText) => {

    voteMessage.textContent =
        messageText;

});


// LIVE RESULTS
socket.on("resultsUpdated", (data) => {

    participantTotalVotes.textContent =
        data.totalVotes;

    data.votes.forEach((vote, index) => {

        const voteCount =
            document.getElementById(
                `participant-vote-${index}`
            );

        const voteBar =
            document.getElementById(
                `participant-bar-${index}`
            );

        if (voteCount) {

            voteCount.textContent =
                vote;

        }

        if (voteBar) {

            const percentage =
                data.totalVotes === 0
                    ? 0
                    : (vote / data.totalVotes) * 100;

            voteBar.style.width =
                `${percentage}%`;

        }

    });

});


// POLL ENDED
socket.on("pollEnded", (data) => {

    const buttons =
        document.querySelectorAll(
            ".vote-button"
        );

    buttons.forEach(button => {

        button.disabled = true;

    });

    participantTotalVotes.textContent =
        data.totalVotes;

    data.votes.forEach((vote, index) => {

        const voteCount =
            document.getElementById(
                `participant-vote-${index}`
            );

        const voteBar =
            document.getElementById(
                `participant-bar-${index}`
            );

        if (voteCount) {

            voteCount.textContent =
                vote;

        }

        if (voteBar) {

            const percentage =
                data.totalVotes === 0
                    ? 0
                    : (vote / data.totalVotes) * 100;

            voteBar.style.width =
                `${percentage}%`;

        }

        if (
            index === data.winnerIndex &&
            data.totalVotes > 0
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
                document.createElement("p");

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

    });

    voteMessage.innerHTML = `
        <h3>Poll Ended</h3>
        <p>Final results are shown above.</p>
    `;

});


// JOIN ERROR
socket.on("joinError", (messageText) => {

    alert(messageText);

});