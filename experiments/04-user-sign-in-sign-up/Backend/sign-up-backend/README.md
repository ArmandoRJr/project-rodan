[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-24ddc0f5d75046c5622901739e7c5dd533143b0c8e959d652212380cedb1ea36.svg)](https://classroom.github.com/a/ywiCKiN9)

# Web Gallery: Managing Users

The objective of these assignments is to build an application called _The Web Gallery_ where users can share pictures and comments. This application is similar to existing web applications such as Facebook, Instagram or Google Photos.

In this last assignment, you will concentrate on user authentication, and authorization.

## Instructions

For this assignment, you should use Node.js, [Express.js](https://expressjs.com/), [sequelize](https://sequelize.org/) and sqlite to build your backend. You should not need more than the packages that were introduced in the labs.

Make sure that all of these required packages are recorded in the `package.json` file.

### Code quality and organization

All of your work should be well organized. This directory should be organized as follows:

- `app.js`: the app entrypoint
- `static/`: your frontend developed for assignment 1 (HTML, CSS, Javascript and UI media files)
- `routers/`: the routers for the different resources
- `models/`: the models for the different resources
- `package.json` and `package-lock.json`: the Node.js package file
- `uploads/`: the uploaded files
- `.gitignore`: list of files that should not be committed to github

Your code must be of good quality and follow all guidelines given during lectures and labs. For more details, please refer to the rubric. Remember, any code found online and improperly credited can constitute an academic violation.

### Submission

You should submit your work to your Github course repository and Gradescope.

Before submitting your final version. It is strongly recommended verifying that your code is portable. To do so:

- push your work to Github
- clone it into a new directory
- install all packages with the single command `npm install` that will install all packages found in the `package.json` file
- start the app with the command `node app.js`

> [!WARNING]
> As mentioned in the first lecture, if your code does not work like the above, you will automatically receive a **0**.

## Multiple Galleries and Multiple Users

In this part, you are going to extend your API to support authenticated users and multiple galleries. Each user will now have his/her own gallery. All previous rules for 1 gallery applies.

## Authentication (up to 25 points)

Users should be able to sign-up, sign-in and sign-out and no longer need to enter a username when adding images and comments.

You may choose to implement authentication using only 1 of the following approaches:

- Session cookies approach as shown in lab (max 20 points)
- Access token / Bearer token approach (max 25 points)

## Authorization Policies (25 points)

You must implement the following authorization policies:

- Unauthenticated users can view all galleries, but cannot view any comments
- Authenticated users can sign-out of the application
- Authenticated users can browse any gallery and its comments
- Gallery owners can upload and delete pictures to their own gallery only
- Authenticated users can post comments on any picture of any gallery
- Authenticated users can delete any one of their own comments but not others
- Gallery owners can delete any comment on any picture from their own gallery

While refactoring your application, you should redesign your REST API to reflect the fact that image galleries are owned by users.

## Frontend SPA Update (up to 20 points)

This part of the assignment builds on top of what you have already built for assignment 2.
Update your current frontend to reflect all changes made above. The homepage should now a paginated list of all galleries that can be browsed.

You may choose to:

- Create separate HTML pages for `index.html`, `login.html`, and `credits.html` (max 15 points)
- Create a true single page application (SPA) with javascript loading all pages. (max 20 points)

> [!NOTE]
> If the user does not have access to an action, the action buttons should be hidden or disabled
> accordingly.

## Syllabus

- Feature for multiple galleries [20pts]
- Authentication & Code Quality [20pts]
- Authorization & Code Quality [30pts]
- Frontend SPA Update [20pts]
- Repository quality and organization [10pts]

Total: 100pts
