//closure because best practices
(function () {
  "use strict";

  //gonna store the state here since it will be useful for how I am implementing this
  const state = {
    current_image: "none",
    prev_cursor: "none",
    next_cursor: "none",
    cursor: "none",
    current_comment_page: 0,
    current_user_page: 0,
    number_of_images: 0,
    submit_box_hidden: "false",
    latest_comments: [],
    prev_comments: [],
    next_comments: [],
    users: [],
    next_users: [],
    prev_users: [],
    authenticated: "false",
    token: "none",
    username: "none",
    selectedUser: null,
    signUp: "false",
    credits: "false",
  };

  /**
   * This function will render the image component of the site.
   * It will take in the current_image and current_comment_page as its
   * input and add the relevant html in. It will be run when the image
   * on screen is needed to be changed. An API call to get image
   * will be made, which is based off the cursor in the state object.
   * (Cursor based pagination)
   *
   */

  function renderImage() {
    if (state.selectedUser == null) {
      document.querySelector(".title").innerHTML = `image galleries`;
    } else {
      document.querySelector(".title").innerHTML =
        `${state.selectedUser}'s image gallery`;
    }
    document.querySelector(".comments-section").classList.add("hidden");
    document.querySelector(".submit-image-btn").classList.add("hidden");
    document.querySelector(".image-display").innerHTML =
      `<div class="loader"></div><div>Loading Images, please wait...</div>`;
    document.querySelector(".auth-toggle").classList.add("hidden");
    document.querySelector(".log-out-button").classList.add("hidden");
    document.querySelector(".credits-btn").classList.add("hidden");
    document.querySelector(".users-section").classList.add("hidden");
    apiService
      .getImage(state.cursor, state.selectedUser)
      .then(function (response) {
        document.querySelector(".users-section").classList.remove("hidden");
        document.querySelector(".credits-btn").classList.remove("hidden");
        if (state.authenticated === "true") {
          document.querySelector(".log-out-button").classList.remove("hidden");
        } else {
          document.querySelector(".auth-toggle").classList.remove("hidden");
        }
        document.querySelector(".submit-image-btn").classList.remove("hidden");
        let responseObject = response;
        state.current_image = responseObject.image;

        if (state.current_image === "none") {
          state.cursor = "none";
        } else {
          state.cursor = state.current_image.id;
        }

        state.prev_cursor = responseObject.prevCursor;
        state.next_cursor = responseObject.nextCursor;

        if (state.selectedUser == null) {
          document.querySelector(".image-display").innerHTML =
            "Please select a user from the list below to see their gallery.";
          renderComments();
        } else if (state.current_image === "none") {
          document.querySelector(".image-display").innerHTML =
            "Sorry, there are currently no images in this gallery.";
          renderComments();
        } else {
          //Get all the main image UI compononents up on the screen
          document.querySelector(".image-display").innerHTML = `
        <div>
            <img src="/api/images/${state.current_image.id}/image" alt="${state.current_image.title}" />
            <p>This picture is titled ${state.current_image.title} and is by ${state.current_image.author}</p>
            <div>
                <button class="btn btn-delete-image">Delete</button>
                <button class="btn btn-next-image">Next</button>
                <button class="btn btn-previous-image">Prev</button>
            </div>
            <p>There are currently ${response.imageAmount.count} images in the gallery</p>
        </div>
        `;
          //adding in the comments section

          //Here is condition checks which disable buttons for next/previous images/ when neccesary, based on what we got off the API call
          if (state.next_cursor === "none") {
            document.querySelector(".btn-next-image").disabled = true;
          }

          if (
            state.authenticated === "false" ||
            state.username !== state.selectedUser
          ) {
            document.querySelector(".btn-delete-image").classList.add("hidden");
          }

          if (state.prev_cursor === "none") {
            document.querySelector(".btn-previous-image").disabled = true;
          }

          //This defines the behaviour of the delete image button, which may vary depending on where an image is located in localStorage
          document
            .querySelector(".btn-delete-image")
            .addEventListener("click", function () {
              document
                .querySelector(".comments-section")
                .classList.add("hidden");
              document
                .querySelector(".submit-image-btn")
                .classList.add("hidden");
              document.querySelector(".image-display").innerHTML =
                `<div class="loader"></div><div>Deleting Image, please wait...</div>`;
              document.querySelector(".auth-toggle").classList.add("hidden");
              document.querySelector(".log-out-button").classList.add("hidden");
              document.querySelector(".credits-btn").classList.add("hidden");
              document.querySelector(".users-section").classList.add("hidden");
              apiService
                .deleteImage(state.cursor, state.token)
                .then(function () {
                  document
                    .querySelector(".users-section")
                    .classList.remove("hidden");
                  document
                    .querySelector(".credits-btn")
                    .classList.remove("hidden");
                  if (state.authenticated === "true") {
                    document
                      .querySelector(".log-out-button")
                      .classList.remove("hidden");
                  } else {
                    document
                      .querySelector(".auth-toggle")
                      .classList.remove("hidden");
                  }

                  document
                    .querySelector(".submit-image-btn")
                    .classList.remove("hidden");
                  if (state.next_cursor !== "none") {
                    state.cursor = state.next_cursor;
                  } else if (state.prev_cursor !== "none") {
                    state.cursor = state.prev_cursor;
                  } else {
                    state.cursor = "none";
                  }
                  document
                    .querySelector(".comments-section")
                    .classList.remove("hidden");
                  state.current_comment_page = 0;
                  renderImage();
                });
            });

          //Defining the behaviour of the next image/previous image button
          document
            .querySelector(".btn-next-image")
            .addEventListener("click", function () {
              state.cursor = state.next_cursor;
              state.current_comment_page = 0;
              renderImage();
            });

          document
            .querySelector(".btn-previous-image")
            .addEventListener("click", function () {
              state.cursor = state.prev_cursor;
              state.current_comment_page = 0;
              renderImage();
            });
          renderComments();
        }
      });
  }

  //Function for rendering the neccesary comment components on screen, including all neccesary buttons and comments
  function renderComments() {
    if (state.authenticated === "false") {
      document.querySelector(".comments-section").classList.add("hidden");
      return;
    }

    if (state.cursor === "none" || state.selectedUser == null) {
      document.querySelector(".comments-section").classList.add("hidden");
    } else {
      document.querySelector(".comments-section").classList.remove("hidden");

      document.querySelector(".comments-section").innerHTML =
        `<div class="loader"></div><div>Loading Comments, please wait...</div>`;

      document.querySelector(".submit-image-btn").classList.add("hidden");
      document.querySelector(".btn-next-image").classList.add("hidden");
      document.querySelector(".btn-previous-image").classList.add("hidden");
      document.querySelector(".btn-delete-image").classList.add("hidden");
      document.querySelector(".auth-toggle").classList.add("hidden");
      document.querySelector(".log-out-button").classList.add("hidden");
      document.querySelector(".credits-btn").classList.add("hidden");
      document.querySelector(".users-section").classList.add("hidden");

      apiService
        .getComments(state.cursor, state.current_comment_page, state.token)
        .then(function (response) {
          document.querySelector(".users-section").classList.remove("hidden");
          document.querySelector(".credits-btn").classList.remove("hidden");
          if (state.authenticated === "true") {
            document
              .querySelector(".log-out-button")
              .classList.remove("hidden");
          } else {
            document.querySelector(".auth-toggle").classList.remove("hidden");
          }
          state.latest_comments = response.comments;
          state.prev_comments = response.prev_comments;
          state.next_comments = response.next_comments;

          document.querySelector(".btn-next-image").classList.remove("hidden");
          document
            .querySelector(".btn-previous-image")
            .classList.remove("hidden");
          if (state.username === state.selectedUser) {
            document
              .querySelector(".btn-delete-image")
              .classList.remove("hidden");
          }

          document
            .querySelector(".submit-image-btn")
            .classList.remove("hidden");

          if (state.current_comment_page - 1 >= 0) {
            state.prev_comments = response.comments;
          } else {
            state.prev_comments = [];
          }

          document.querySelector(".comments-section").innerHTML = `
                <form class="add-comments-form">
                    <input
                        name="content"
                        id="newCommentContent"
                        class="new-comment-content"
                        type="text"
                        placeholder="Enter your comment here"
                    />
                    <input
                        id="submitComment"
                        type="submit"
                        class="btn btn-blue"
                        value="Submit"
                    />
                </form>
                <div class="comments-list"></div>
                <div>
                    <button class="btn btn-next-comments">Next</button>
                    <button class="btn btn-previous-comments">Prev</button>
                </div>
            `;

          if (state.prev_comments.length === 0) {
            document.querySelector(".btn-previous-comments").disabled = true;
          }

          if (state.next_comments.length === 0) {
            document.querySelector(".btn-next-comments").disabled = true;
          }

          document
            .querySelector(".btn-previous-comments")
            .addEventListener("click", function () {
              state.current_comment_page = state.current_comment_page - 1;
              renderComments();
            });

          document
            .querySelector(".btn-next-comments")
            .addEventListener("click", function () {
              state.current_comment_page = state.current_comment_page + 1;
              renderComments();
            });

          //defining what happens when the user submits a comment. Update the dom and make api calls to the database accordingly, etc etc
          document
            .querySelector(".add-comments-form")
            .addEventListener("submit", function (e) {
              e.preventDefault();

              const formData = new FormData(e.target);
              const formProps = Object.fromEntries(formData);

              if (formProps.content.length === 0) {
                return;
              }
              document.querySelector(".comments-section").innerHTML =
                `<div class="loader"></div><div>Adding your Comment, please wait...</div>`;
              document
                .querySelector(".submit-image-btn")
                .classList.add("hidden");
              document.querySelector(".btn-next-image").classList.add("hidden");
              document
                .querySelector(".btn-previous-image")
                .classList.add("hidden");
              document
                .querySelector(".btn-delete-image")
                .classList.add("hidden");

              document.querySelector(".auth-toggle").classList.add("hidden");
              document.querySelector(".log-out-button").classList.add("hidden");
              document.querySelector(".credits-btn").classList.add("hidden");
              document.querySelector(".users-section").classList.add("hidden");

              apiService
                .addComment(
                  state.cursor,
                  state.username,
                  formProps.content,
                  state.token,
                )
                .then(function () {
                  document
                    .querySelector(".users-section")
                    .classList.remove("hidden");
                  document
                    .querySelector(".credits-btn")
                    .classList.remove("hidden");
                  if (state.authenticated === "true") {
                    document
                      .querySelector(".log-out-button")
                      .classList.remove("hidden");
                  } else {
                    document
                      .querySelector(".auth-toggle")
                      .classList.remove("hidden");
                  }
                  e.target.reset();

                  document
                    .querySelector(".btn-next-image")
                    .classList.remove("hidden");
                  document
                    .querySelector(".btn-previous-image")
                    .classList.remove("hidden");
                  if (state.username === state.selectedUser) {
                    document
                      .querySelector(".btn-delete-image")
                      .classList.remove("hidden");
                  }

                  document
                    .querySelector(".submit-image-btn")
                    .classList.remove("hidden");

                  renderComments();
                });
            });

          //Loop through the 10 latest comments and add the corresponding comment components for them to the DOM
          for (let i = 0; i < state.latest_comments.length; i++) {
            let comment = document.createElement("div");
            comment.innerHTML = `
        <div class="comment">
            <p class="comment-username">${state.latest_comments[i].author}</p>
            <p class="comment-content">${state.latest_comments[i].content}</p>
            <p class="comment-date">${state.latest_comments[i].date}</p>
            <button class="btn btn-delete-comment">Delete Comment</button>
        </div>
        `;

            document.querySelector(".comments-list").append(comment);

            //define behaviour for deleting comments
            if (
              state.selectedUser !== state.username &&
              state.username !== state.latest_comments[i].author
            ) {
              comment
                .querySelector(".btn-delete-comment")
                .classList.add("hidden");
            }

            comment
              .querySelector(".btn-delete-comment")
              .addEventListener("click", function () {
                document.querySelector(".comments-section").innerHTML =
                  `<div class="loader"></div><div>Deleting Comment, please wait...</div>`;
                document
                  .querySelector(".submit-image-btn")
                  .classList.add("hidden");
                document
                  .querySelector(".btn-next-image")
                  .classList.add("hidden");
                document
                  .querySelector(".btn-previous-image")
                  .classList.add("hidden");
                document
                  .querySelector(".btn-delete-image")
                  .classList.add("hidden");
                document.querySelector(".auth-toggle").classList.add("hidden");
                document
                  .querySelector(".log-out-button")
                  .classList.add("hidden");
                document.querySelector(".credits-btn").classList.add("hidden");
                document
                  .querySelector(".users-section")
                  .classList.add("hidden");
                apiService
                  .deleteComment(state.latest_comments[i].id, state.token)
                  .then(function () {
                    document
                      .querySelector(".users-section")
                      .classList.remove("hidden");
                    document
                      .querySelector(".credits-btn")
                      .classList.remove("hidden");
                    if (state.authenticated === "true") {
                      document
                        .querySelector(".log-out-button")
                        .classList.remove("hidden");
                    } else {
                      document
                        .querySelector(".auth-toggle")
                        .classList.remove("hidden");
                    }

                    document
                      .querySelector(".submit-image-btn")
                      .classList.remove("hidden");
                    document
                      .querySelector(".btn-next-image")
                      .classList.remove("hidden");
                    document
                      .querySelector(".btn-previous-image")
                      .classList.remove("hidden");
                    if (state.username === state.selectedUser) {
                      document
                        .querySelector(".btn-delete-image")
                        .classList.remove("hidden");
                    }
                    if (
                      state.latest_comments.length === 1 &&
                      state.current_comment_page > 0
                    ) {
                      state.current_comment_page =
                        state.current_comment_page - 1;
                    }

                    renderComments();
                  });
              });
          }
        });
    }
  }
  //Function which renders the neccesary components for the list of users on the screen
  function renderUsers() {
    document.querySelector(".auth-toggle").classList.add("hidden");
    document.querySelector(".log-out-button").classList.add("hidden");
    document.querySelector(".credits-btn").classList.add("hidden");
    document.querySelector(".comments-section").classList.add("hidden");
    document.querySelector(".submit-image-btn").classList.add("hidden");
    document.querySelector(".image-display").innerHTML =
      `<div class="loader"></div><div>Loading Users, please wait...</div>`;
    document.querySelector(".users-section").classList.add("hidden");
    apiService.getUsers(state.current_user_page).then(function (response) {
      document.querySelector(".users-section").classList.remove("hidden");
      if (state.authenticated === "true") {
        document.querySelector(".log-out-button").classList.remove("hidden");
        if (state.cursor !== "none") {
          document
            .querySelector(".comments-section")
            .classList.remove("hidden");
        }
      } else {
        document.querySelector(".auth-toggle").classList.remove("hidden");
      }
      document.querySelector(".submit-image-btn").classList.remove("hidden");
      document.querySelector(".credits-btn").classList.remove("hidden");
      const users = response.users;
      state.users = response.users;
      state.next_users = response.next_users;
      if (state.current_user_page >= 1) {
        state.prev_users = response.prev_users;
      } else {
        state.prev_users = [];
      }

      const usersList = document.getElementById("users-list");
      usersList.innerHTML = "";
      users.forEach((user) => {
        const userItem = document.createElement("li");
        userItem.textContent = user.username;
        userItem.addEventListener("click", () => {
          state.selectedUser = user.username;
          state.cursor = "none";
          renderImage();
        });
        usersList.appendChild(userItem);
      });

      if (state.prev_users.length === 0) {
        document.querySelector(".btn-previous-users").disabled = true;
      } else {
        document.querySelector(".btn-previous-users").disabled = false;
      }

      if (state.next_users.length === 0) {
        document.querySelector(".btn-next-users").disabled = true;
      } else {
        document.querySelector(".btn-next-users").disabled = false;
      }
    });
  }

  //This triggers when all the DOM content has loaded, and runs renderImage, and renderUsers to get the neccesary image components and comment components up on the screen
  window.addEventListener("DOMContentLoaded", function () {
    document.querySelector(".credits-text").classList.add("hidden");
    document.querySelector(".log-out-button").classList.add("hidden");
    document.querySelector(".auth-form").classList.add("hidden");

    document
      .querySelector(".btn-previous-users")
      .addEventListener("click", function () {
        state.current_user_page = state.current_user_page - 1;
        renderUsers();
        renderImage();
      });

    document
      .querySelector(".btn-next-users")
      .addEventListener("click", function () {
        state.current_user_page = state.current_user_page + 1;
        renderUsers();
        renderImage();
      });

    if (localStorage.getItem("token")) {
      let checkToken = localStorage.getItem("token");
      document.querySelector(".auth-toggle").classList.add("hidden");
      document.querySelector(".log-out-button").classList.add("hidden");
      document.querySelector(".credits-btn").classList.add("hidden");
      document.querySelector(".comments-section").classList.add("hidden");
      document.querySelector(".submit-image-btn").classList.add("hidden");
      document.querySelector(".image-display").innerHTML =
        `<div class="loader"></div><div>Loading, please wait...</div>`;
      document.querySelector(".users-section").classList.add("hidden");
      apiService.verifyToken(checkToken).then(function (response) {
        document.querySelector(".users-section").classList.remove("hidden");
        document.querySelector(".credits-btn").classList.remove("hidden");
        if (response.valid === "true") {
          state.authenticated = "true";
          state.token = checkToken;
          state.username = response.token.username;
          document.querySelector(".auth-toggle").classList.add("hidden");
          document
            .querySelector(".submit-image-btn")
            .classList.remove("hidden");
          if (state.submit_box_hidden === "false") {
            document
              .querySelector(".add-image-form")
              .classList.remove("hidden");
          }
          document
            .querySelector(".btn-toggle-image")
            .classList.remove("hidden");
          document.querySelector(".log-out-button").classList.remove("hidden");
          document
            .querySelector(".comments-section")
            .classList.remove("hidden");
          renderImage();
        } else {
          document.querySelector(".auth-toggle").classList.remove("hidden");
          document.querySelector(".log-out-button").classList.add("hidden");
          renderImage();
        }
      });
    }

    document
      .querySelector(".log-in-button")
      .addEventListener("click", function (e) {
        e.preventDefault();
        const username = document.querySelector(".auth-username").value;
        const password = document.querySelector(".auth-password").value;

        if (
          username.length === 0 ||
          password.length === 0 ||
          username.indexOf(" ") >= 0 ||
          password.indexOf(" ") >= 0
        ) {
          return;
        }
        document.querySelector(".auth-message").innerHTML =
          "Please wait, signing you in....";
        document.querySelector(".log-in-button").classList.add("hidden");
        document.querySelector(".sign-up-button").classList.add("hidden");
        document.querySelector(".auth-toggle").classList.add("hidden");
        apiService.signin(username, password).then(function (response) {
          document.querySelector(".log-in-button").classList.remove("hidden");
          document.querySelector(".sign-up-button").classList.remove("hidden");
          document.querySelector(".auth-toggle").classList.remove("hidden");
          if (response.message === "Login successful") {
            state.authenticated = "true";
            state.token = response.token;
            localStorage.setItem("token", state.token);
            state.username = username;

            if (state.authenticated === "true") {
              if (state.submit_box_hidden === "false") {
                document
                  .querySelector(".add-image-form")
                  .classList.remove("hidden");
              }
              document
                .querySelector(".btn-toggle-image")
                .classList.remove("hidden");
              if (state.cursor !== "none") {
                document
                  .querySelector(".comments-section")
                  .classList.remove("hidden");
              }
            }
            document.querySelector(".users-section").classList.remove("hidden");
            document.querySelector(".image-display").classList.remove("hidden");
            document.querySelector(".auth-toggle").classList.add("hidden");
            document
              .querySelector(".log-out-button")
              .classList.remove("hidden");
            document.querySelector(".auth-form").classList.add("hidden");
            document.querySelector(".auth-message").innerHTML = "";
            state.signUp = "false";
            renderUsers();
            renderImage();
          } else {
            document.querySelector(".auth-message").innerHTML =
              "Username/Password incorrect. Please try again.";
          }
        });
      });

    document
      .querySelector(".credits-btn")
      .addEventListener("click", function () {
        if (state.credits === "false") {
          document.querySelector(".add-image-form").classList.add("hidden");

          document.querySelector(".log-out-button").classList.add("hidden");
          document.querySelector(".btn-toggle-image").classList.add("hidden");
          document.querySelector(".comments-section").classList.add("hidden");
          document.querySelector(".users-section").classList.add("hidden");
          document.querySelector(".image-display").classList.add("hidden");
          document.querySelector(".auth-toggle").classList.add("hidden");
          document.querySelector(".credits-text").classList.remove("hidden");

          state.credits = "true";
        } else if (state.credits === "true") {
          if (state.authenticated === "true") {
            if (state.submit_box_hidden === "false") {
              document
                .querySelector(".add-image-form")
                .classList.remove("hidden");
            }
            document
              .querySelector(".btn-toggle-image")
              .classList.remove("hidden");
            document
              .querySelector(".comments-section")
              .classList.remove("hidden");
            document
              .querySelector(".log-out-button")
              .classList.remove("hidden");
          } else {
            document.querySelector(".auth-toggle").classList.remove("hidden");
          }

          document.querySelector(".users-section").classList.remove("hidden");
          document.querySelector(".image-display").classList.remove("hidden");
          document.querySelector(".credits-text").classList.add("hidden");
          state.credits = "false";
          renderImage();
        }
      });

    document
      .querySelector(".sign-up-button")
      .addEventListener("click", function (e) {
        e.preventDefault();
        const username = document.querySelector(".auth-username").value;
        const password = document.querySelector(".auth-password").value;

        if (
          username.length === 0 ||
          password.length === 0 ||
          username.indexOf(" ") >= 0 ||
          password.indexOf(" ") >= 0
        ) {
          return;
        }
        document.querySelector(".auth-message").innerHTML =
          "Please wait, signing you up....";
        document.querySelector(".log-in-button").classList.add("hidden");
        document.querySelector(".sign-up-button").classList.add("hidden");
        document.querySelector(".auth-toggle").classList.add("hidden");

        apiService.signup(username, password).then(function (response) {
          document.querySelector(".log-in-button").classList.remove("hidden");
          document.querySelector(".sign-up-button").classList.remove("hidden");
          document.querySelector(".auth-toggle").classList.remove("hidden");
          if (response.message === "Sign-up-Succesful") {
            state.username = username;
            document.querySelector(".auth-message").innerHTML =
              "Succesfully signed up! Now please log in.";
          } else {
            document.querySelector(".auth-message").innerHTML =
              "Sorry, we had trouble signing you up. Please try again.";
          }
        });
      });

    document
      .querySelector(".auth-toggle")
      .addEventListener("click", function () {
        if (state.signUp === "false") {
          document.querySelector(".add-image-form").classList.add("hidden");
          document.querySelector(".btn-toggle-image").classList.add("hidden");
          document.querySelector(".comments-section").classList.add("hidden");
          document.querySelector(".users-section").classList.add("hidden");
          document.querySelector(".image-display").classList.add("hidden");
          document.querySelector(".auth-toggle").innerHTML = "Go Back";
          document.querySelector(".auth-form").classList.remove("hidden");
          document.querySelector(".credits-btn").classList.add("hidden");
          state.signUp = "true";
        } else if (state.signUp === "true") {
          if (state.authenticated === "true") {
            if (state.submit_box_hidden === "false") {
              document
                .querySelector(".add-image-form")
                .classList.remove("hidden");
            }
            document
              .querySelector(".btn-toggle-image")
              .classList.remove("hidden");
            document
              .querySelector(".comments-section")
              .classList.remove("hidden");
          }
          document.querySelector(".auth-message").innerHTML = "";
          document.querySelector(".users-section").classList.remove("hidden");
          document.querySelector(".image-display").classList.remove("hidden");
          document.querySelector(".auth-toggle").innerHTML = "Log In/Sign Up";
          document.querySelector(".auth-form").classList.add("hidden");
          document.querySelector(".credits-btn").classList.remove("hidden");
          state.signUp = "false";
          renderUsers();
          renderImage();
        }
      });

    document
      .querySelector(".log-out-button")
      .addEventListener("click", function () {
        localStorage.setItem("token", "");
        state.authenticated = "false";
        state.token = "none";
        state.username = "none";
        document.querySelector(".btn-toggle-image").classList.add("hidden");
        document.querySelector(".auth-toggle").classList.remove("hidden");
        document.querySelector(".auth-toggle").innerHTML = "Log In/Sign Up";
        document.querySelector(".log-out-button").classList.add("hidden");
        document.querySelector(".add-image-form").classList.add("hidden");
        renderImage();
      });

    document
      .querySelector(".add-image-form")
      .addEventListener("submit", function (e) {
        e.preventDefault();

        let formData = new FormData();

        let title = document.querySelector(".new-image-title").value;
        let author = state.username;

        let image = document.querySelector(".new-image").files[0];

        formData.append("title", title);
        formData.append("picture", image);
        formData.append("author", author);

        document.querySelector(".submit-image-btn").classList.add("hidden");
        document.querySelector(".image-display").innerHTML =
          `<div class="loader"></div><div>Adding your image, please wait...</div>`;
        document.querySelector(".comments-section").classList.add("hidden");
        document.querySelector(".auth-toggle").classList.add("hidden");
        document.querySelector(".log-out-button").classList.add("hidden");
        document.querySelector(".credits-btn").classList.add("hidden");
        document.querySelector(".users-section").classList.add("hidden");
        apiService.addImage(formData, state.token).then(function (response) {
          document.querySelector(".users-section").classList.remove("hidden");
          document.querySelector(".credits-btn").classList.remove("hidden");
          if (state.authenticated === "true") {
            document
              .querySelector(".log-out-button")
              .classList.remove("hidden");
          } else {
            document.querySelector(".auth-toggle").classList.remove("hidden");
          }
          if (state.authenticated === "true") {
            document
              .querySelector(".submit-image-btn")
              .classList.remove("hidden");
            document
              .querySelector(".comments-section")
              .classList.remove("hidden");
          }
          if (response.uploaded === "yes") {
            state.cursor = "none";
          }

          e.target.reset();

          renderImage();
        });
      });

    if (state.authenticated === "false") {
      document.querySelector(".btn-toggle-image").classList.add("hidden");
      document.querySelector(".add-image-form").classList.add("hidden");
    }

    renderUsers();
    renderImage();

    document
      .querySelector(".btn-toggle-image")
      .addEventListener("click", function () {
        if (state.submit_box_hidden === "false") {
          document.querySelector(".add-image-form").classList.add("hidden");
          document.querySelector(".btn-toggle-image").innerHTML = "show";
          state.submit_box_hidden = "true";
        } else {
          document.querySelector(".add-image-form").classList.remove("hidden");
          document.querySelector(".btn-toggle-image").innerHTML = "hide";
          state.submit_box_hidden = "false";
        }
      });
  });
})();
