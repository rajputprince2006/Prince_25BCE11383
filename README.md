# Live Polling / Quiz Application

A real-time web-based polling and quiz application where an administrator can create a poll, participants can join using a unique room code, and everyone receives live updates without refreshing the page.

## Problem Statement

Traditional polling and quiz systems often require manual updates or page refreshes to display voting results. This creates delays and reduces interaction.

This project provides a real-time polling system where poll creation, participant joining, voting, vote counts, timers, and final results are synchronized instantly using WebSocket technology.

## Solution

The application uses a client-server architecture with Socket.IO for real-time communication.

The Admin creates a poll and receives a unique room code. Participants enter the room code to join the poll. When voting begins, participants can submit their votes and the results are updated live for everyone.

The system also includes a voting timer and automatically ends the poll when the timer reaches zero.

## Key Features

### Admin Features

- Create a poll with a question
- Add between 2 and 6 options
- Remove options dynamically
- Automatically generate a unique room code
- View the waiting room
- View live participant count
- View participant names
- Start the poll
- Set voting duration
- Monitor live voting results
- Manually end the poll
- Automatically end the poll when the timer expires
- Display the final winner

### Participant Features

- Join a poll using a room code
- Enter participant name
- View waiting room
- Receive real-time poll status updates
- View the question and options
- Submit a vote
- Prevent multiple voting
- Receive immediate vote confirmation
- View live voting results
- View remaining voting time
- View final results after the poll ends

## Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Node.js
- Express.js

### Real-Time Communication

- Socket.IO

### Storage

- In-memory JavaScript objects

## System Architecture

```text
                    ┌─────────────────────┐
                    │       ADMIN         │
                    │                     │
                    │ Create Poll         │
                    │ Start Poll          │
                    │ End Poll            │
                    └──────────┬──────────┘
                               │
                               │
                         Socket.IO
                               │
                               ▼
                    ┌─────────────────────┐
                    │      NODE.JS        │
                    │      SERVER         │
                    │                     │
                    │ Express             │
                    │ Socket.IO           │
                    │ Room Management     │
                    │ Vote Management     │
                    │ Timer Management    │
                    └──────────┬──────────┘
                               │
                         Socket.IO
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
       ┌─────────────────┐          ┌─────────────────┐
       │   PARTICIPANT   │          │   PARTICIPANT   │
       │                 │          │                 │
       │ Join Room       │          │ Join Room       │
       │ Vote            │          │ Vote            │
       │ Live Results    │          │ Live Results    │
       └─────────────────┘          └─────────────────┘
