const express = require("express");
const bodyParser = require("body-parser");
const { render } = require("ejs");
const app = express();
const PORT = 8080;

function generateRandomString() {
  let results = "";
  for (let i = 0; i < 6; i++) {
    const randomCharCode = Math.floor(Math.random() * 26 + 97);
    const randomChar = String.fromCharCode(randomCharCode);
    results += randomChar;
  }
  return results;
};

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
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
  };

  const templateVars = { 
    shortURL: shortURL,
    longURL: urlDatabase[shortURL] 
  };
  res.render("urls_show", templateVars);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params;

  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    const templateVars = {
      status: 404,
      message: "Invalid URL"
    };
    return res.status(404).render("urls_error", templateVars);
  };

  res.status(302).redirect(urlObj);
});

app.post("/urls", (req, res) => {
  console.log(req.body); 
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

// Delete 
app.post("/urls/:shortURL/delete", (req, res) => {
  const { shortURL } = req.params;

  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    const templateVars = {
      status: 204,
      message: "Invalid URL"
    };
    return res.status(404).render("urls_error", templateVars);
  };

  delete urlDatabase[shortURL];
  res.status(301).redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

