let apiService = (function () {
  "use strict";
  let module = {};

  /*  ******* Data types *******
    image objects must have at least the following attributes:
        - (String) imageId 
        - (String) title
        - (String) author
        - (String) url
        - (Date) date

    comment objects must have the following attributes
        - (String) commentId
        - (String) imageId
        - (String) author
        - (String) content
        - (Date) date
  */

  module.addImage = function (formData, token) {
    return fetch(`/api/images/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then((res) => res.json());
  };

  // retrieve the image corresponding to where the cursor currently is
  module.getImage = function (cursor, username) {
    if (cursor === "none") {
      return fetch(`/api/images/user/${username}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
    } else {
      return fetch(`/api/images/user/${username}?cursor=${cursor}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
    }
  };

  // delete an image from the gallery given its imageId
  module.deleteImage = function (imageId, token) {
    return fetch(`/api/images/${imageId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json());
  };

  // add a comment to an image
  module.addComment = function (imageId, author, content, token) {
    return fetch(`/api/comments/${imageId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: content, author: author }),
    }).then((res) => res.json());
  };

  // delete a comment to an image
  module.deleteComment = function (commentId, token) {
    return fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json());
  };

  // return an array of all the comments associated to the image associated with the corresponding imageId on a certain page
  module.getComments = function (imageId, page, token) {
    if (!page) {
      return fetch(`/api/comments/${imageId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => res.json());
    } else {
      return fetch(`/api/comments/${imageId}?page=${page}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => res.json());
    }
  };

  module.verifyToken = function (token) {
    return fetch(`/api/verify-token`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json());
  };

  module.signup = function (username, password) {
    return fetch(`/api/users/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).then((res) => res.json());
  };

  module.signin = function (username, password) {
    return fetch(`/api/users/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).then((res) => res.json());
  };

  module.getUsers = function (page) {
    return fetch(`/api/users/?page=${page}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());
  };

  return module;
})();
