# Project Rodan (by team Codezilla)

## Team Members

- Armando Rojas (armando.rojas@mail.utoronto.ca)
- Kirtan Ashokkumar Patel (kirtanashok.patel@mail.utoronto.ca)
- Alexander Teeter (a.teeter@mail.utoronto.ca)

## Description

Project Rodan is a competitive web game consisting of 2-4 players where its competitors will take pictures to compete for score:
In the year 2099, the AI "Rodan" has finally taken over the world and put humans under its control. Rodan is greedy, and wants its knowledge database to keep growing so that it may become more powerful. Competitors will play in rounds where they'll be given a prompt by the AI (e.g. "give me something to eat") and they will take pictures relating to the prompts. These pictures will be rated by the AI and assigned a score. The player with the best score at the end of all rounds will survive, while the rest will never be heard from again.

## Fulfillment of required elements

The application will...

- be built using Angular (and be a Single Page Application)
- use Express as the core backend API
- make use of REST
- utilize Postgres as the database layer (with Sequelize as our ORM)
- be deployed on a VM using Docker and Docker Composer using proper CI/CD
- be accessible to the general public through use of a public domain
- interact with Google Cloud (Vision AI) and OpenAI's API(s)
- use OAuth 2.0 to assign the right permissions to users

## Fulfillment of additional requirements

- The game offers real-time interaction between users, as users will be able to receive prompts throughout multiple rounds, receive picture feedback and use "items" in real time
- The game also executes a long-running task through the notion of having users' pictures be evaluated by the AI (a task performed mainly by third-party APIs as mentioned above)

## Version milestones

### Alpha version

In the game's alpha version, at least two players will be able to join a game room where they'll play against one another.

When the game starts, players will receive a prompt and a timer to complete this prompt. Players will be responsible for taking and submitting pictures with objects that they believe correspond best to this prompt. When both players have submitted pictures (or when time has ran out), players will be scored based on speed, relation of object(s) to prompts and object accuracy.
This will repeat for a few rounds.

When the game ends, each players' score will be displayed and a winner will be highlighted.

### Beta version

Users will receive proper user profiles to keep track of their username, profile pictures, matches played and other interesting statistics.

Items will be introduced to the game. Their main purpose is to be "thrown" to other players in an effort to hinder their progress, such as applying a disortion filter to the image they submit (so that their score decreases).

UI will be developed to showcase game rooms, sprites/icons for Rodan and the players, and each players' statistics and items.

### Final version

UI will be finalized, with animations for events during the game.

The application will receive Continuous Deployment through a combination of GitHub Actions, Docker and a cloud computing/virtual machine service.

## Final Application

The final application can be found [here](https://rodan.armandorojas.me/) (in https://rodan.armandorojas.me/).
The presentation can be found in [Youtube](https://youtu.be/ZV89jnsmO_A) (https://youtu.be/ZV89jnsmO_A)
