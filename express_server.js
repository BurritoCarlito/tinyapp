const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { render } = require("ejs");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "Ian"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "Carlo"
  }
};

const users = {};

// helper function
function generateRandomString() {
  let results = "";
  for (let i = 0; i < 6; i++) {
    const randomCharCode = Math.floor(Math.random() * 26 + 97);
    const randomChar = String.fromCharCode(randomCharCode);
    results += randomChar;
  }
  return results;
}

// helper function
function createNewUser(req) {
  const email = req.body.email;
  const password = req.body.password;

  // if (!email || !password) {
  //   res.status(400).send("Email and/or Password fields cannot be empty");
  //   } else {
  const ID = generateRandomString();
  users[ID] = {
    id: ID,
    email: email,
    password: password
  };
  return users[ID];
}

// helper function
function checkEmailExists(newEmail) {
  for (let user in users) {
    if (users[user].email === newEmail) {
      return users[user];
    }
  }
  return false;
}

// helper function
function checkPassword(users, newPasword) {
  if (users.password === newPasword) {
    return true;
  } else {
    return false;
  }
}

// helper function


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// server sends a response
app.get("/", (req, res) => {
  res.send("Hello!");
});

//gets a route for urls index page
app.get("/urls", (req, res) => {

  const templateVars = {
    urls: urlDatabase,
    userID: req.cookies["user_id"],
    user: users[req.cookies["user_id"]],
  };
  
  console.log("urlDatabase", urlDatabase)
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {

  const templateVars = {
    userID: req.cookies["user_id"],
    user: users[req.cookies["user_id"]]
  };

  res.render("urls_new", templateVars);
});

// renders individual URL details
app.get("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;

  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    const templateVars = {
      status: 404,
      message: "Invalid URL"
    };
    return res.status(404).render("urls_error", templateVars);
  }

  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user: req.cookies.user
  };

  res.render("urls_show", templateVars);
});

//server sends a JSON response
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// GET endpoint - to longURLS
app.get("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params.shortURL;

  const templateVars = {
    user: req.cookies.user
  };

  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    const templateVars = {
      status: 404,
      message: "Invalid URL"
    };

    return res.status(404).render("urls_error", templateVars);
  }

  res.status(302).redirect(urlObj, templateVars);
});

//GET endpoint - request to /register
app.get("/register", (req, res) => {

  const templateVars = {
    user_id: req.cookies["user_id"],
    user: users[req.cookies["user_id"]]
  };

  res.render("register", templateVars);
});


// GET endpoint - request to /login
app.get("/login", (req, res) => {

  const templateVars = {
    user_id: req.cookies["user_id"],
    user: users[req.cookies["user_id"]]
  };

  res.render("login", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});


//Edit the longURL when submitting an new URL
app.post("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;

  // const urlObj = urlDatabase[shortURL];
  // if (!urlObj) {
  //   const templateVars = {
  //     status: 204,
  //     message: "Invalid URL"
  //   };
  //   return res.status(404).render("urls_error", templateVars);
  // };

  
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls");
});

//Edit the longURL when submitting an new URL
app.post("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params;

  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    const templateVars = {
      status: 204,
      message: "Invalid URL"
    };
    return res.status(404).render("urls_error", templateVars);
  };

  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

// Delete
app.post("/urls/:shortURL/delete", (req, res) => {
  const { shortURL } = req.params;
  
  // const urlObj = urlDatabase[shortURL];
  // if (!urlObj) {
  //   const templateVars = {
  //     status: 204,
  //     message: "Invalid URL"
  //   };
  //   return res.status(404).render("urls_error", templateVars);
  // };

  delete urlDatabase[shortURL];
  res.status(301).redirect("/urls");
});

//Registering a new User
app.post("/register", (req, res) => {
  const user = checkEmailExists(req.body.email);
  if (user) {
    res.status(400).send("Email has already been taken, please use a different email.");
    // const templateVars = {
    //   status: 400,
    //   message: "Email already being used, please try another email"
    // };

  } else {
    const newUser = createNewUser(req);
    res.cookie("user_id", newUser.id);
    res.redirect("/urls");
  }
});

//Login
app.post("/login", (req, res) => {
  const user = checkEmailExists(req.body.email);
  const correctPassword = checkPassword(user, req.body.password);
  if (user) {
    if (correctPassword) {
      res.cookie("user_id", user.id);
      res.redirect("/urls");
    } else {
      res.status(403).send("Password is Incorrect, please try again");
    }
  } else {
    res.status(403).send("Email cannot be found, please try again");
  }
});

//Logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
