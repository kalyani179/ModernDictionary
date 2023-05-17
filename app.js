const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const https = require("https");
const nodemailer = require("nodemailer");

const app = express();
var count = 0;
let word;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get("/", function(req, res) {
    res.render("home");
})
app.get("/learn", function(req, res) {
    res.render("learn")
})
app.get("/games", function(req, res) {
    res.render("game")
})
app.get("/contact", function(req, res) {
    res.render("contact");
})
app.get("/sign-up", function(req, res) {
    res.sendFile(__dirname + "/sign-up.html");
})

app.post("/sign-up", function(req, res) {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;

    const data = {
        members: [{
            email_address: email,
            status: "subscribed",
            merge_fields: {
                FNAME: firstName,
                LNAME: lastName
            }
        }]
    }
    const jsonData = JSON.stringify(data);
    const url = "https://us8.api.mailchimp.com/3.0/lists/ac79eb335c";
    const options = {
        method: "POST",
        auth: "kalyani179:7acc2655a9b265d061a7581f05f01cde-us8"
    }
    const request = https.request(url, options, function(response) {
        if (response.statusCode == 200) {
            res.sendFile(__dirname + "/sign-up-success.html");
        } else {
            res.sendFile(__dirname + "/sign-up-failure.html");
        }
    })
    request.write(jsonData);
    request.end();
});
app.post("/sign-up-success", function(req, res) {
    res.redirect("/");
})
app.post("/sign-up-failure", function(req, res) {
    res.redirect("/sign-up");
})
app.post("/query-mail", (req, res) => {
    const userName = req.body.userName;
    const email = req.body.email;
    const query = req.body.query;

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "dantulurikalyani999@gmail.com",
            pass: "kungqvvwokemijtx"
        }
    });
    var mailOptions = {
        from: email,
        to: "dantulurikalyani999@gmail.com",
        subject: userName + " sent you a message",
        text: query
    }
    transporter.sendMail(mailOptions, function(err, info) {
        res.redirect("/contact");
    })

});
app.get("/search-word", function(req, res) {
    res.sendFile(__dirname + "/search-word.html");
})


app.post("/search-word/word", function(req, res) {
    word = req.body.word;
    res.redirect("/search-word/word-audio-interface");
})
app.get("/search-word/word-audio-interface", function(req, res) {
    const apiKey = "a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
    const urlAudio = "https://api.dictionaryapi.dev/api/v2/entries/en/" + word;
    https.get(urlAudio, function(response) {
        if (response.statusCode == 200) {
            response.on("data", function(data) {
                const wordData = JSON.parse(data);
                // const audioUrl = wordData[0].phonetics[0].text;
                res.render("words/word-audio-interface", { word: word });
            });
        } else {
            // res.render("words/word-audio-interface", { word: word });
            res.render("find-failure", { word: word, detail: "Details" });
        }
    });
})
app.get("/search-word/word-definitions", function(req, res) {
    let wordDefinitions = [];
    let wordPartOfSpeech = [];
    const apiKey = "a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
    const urlDef = "https://api.wordnik.com/v4/word.json/" + word + "/definitions?limit=6&includeRelated=false&sourceDictionaries=all&useCanonical=false&includeTags=false&api_key=" + apiKey;
    https.get(urlDef, function(response) {
        if (response.statusCode == 200) {
            response.on("data", function(data) {
                const wordData = JSON.parse(data);
                wordData.forEach(function(element) {
                    if (element.text) {
                        wordPartOfSpeech.push(element.partOfSpeech);
                        wordDefinitions.push(element.text);
                    }
                });

                res.render("words/word-definitions", { word: word, wordDefinitions: wordDefinitions, wordPartOfSpeech: wordPartOfSpeech });
            });
        } else {
            res.render("find-failure", { word: word, detail: "Definitions" });
        }
    });

});
app.get("/search-word/word-examples", function(req, res) {
    let wordExamplesDup = [];
    const apiKey = "a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
    const urlExample = "https://api.wordnik.com/v4/word.json/" + word + "/examples?limit=6&api_key=" + apiKey;
    https.get(urlExample, function(response) {
        if (response.statusCode == 200) {
            response.on("data", function(data) {
                const wordData = JSON.parse(data);
                let wordExample = wordData.examples;
                for (var i = 1; i < wordExample.length; i++) {
                    wordExamplesDup.push(wordExample[i].text);
                }
                const wordExamples = new Set(wordExamplesDup);
                if (wordExamples.size) {
                    res.render("words/word-examples", { word: word, wordExamples: wordExamples });
                } else {
                    res.render("find-failure", { word: word, detail: "Examples" });
                }
            });
        } else {
            res.render("find-failure", { word: word, detail: "Examples" });
        }
    });
});

app.get("/search-word/word-related-words", function(req, res) {
    let antonyms = [];
    let synonyms = [];
    let hypernym = [];
    let rhyme = [];
    let verbForm = [];
    const apiKey = "a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
    const urlRelatedWords = "https://api.wordnik.com/v4/word.json/" + word + "/relatedWords?useCanonical=false&limitPerRelationshipType=10&api_key=" + apiKey;
    https.get(urlRelatedWords, function(response) {
        if (response.statusCode == 200) {
            response.on("data", function(data) {
                const wordData = JSON.parse(data);
                wordData.forEach(function(element) {
                    if (element.relationshipType === "antonym") {
                        antonyms = element.words;
                    } else if (element.relationshipType === "synonym") {
                        synonyms = element.words;
                    } else if (element.relationshipType === "hypernym") {
                        hypernym = element.words;
                    } else if (element.relationshipType === "rhyme") {
                        rhyme = element.words;
                    } else if (element.relationshipType === "verb-form") {
                        verbForm = element.words;
                    }

                })
                if (synonyms.length > 9) {
                    synonyms = synonyms.slice(0, 9);
                }
                if (rhyme.length > 9) {
                    rhyme = rhyme.slice(0, 9);
                }
                if (hypernym.length > 9) {
                    hypernym = hypernym.slice(0, 9);
                }
                if (synonyms.length || antonyms.length || rhyme.length || hypernym.length || verbForm.length)
                    res.render("words/word-related-words", { word: word, antonyms: antonyms, synonyms: synonyms, hypernym: hypernym, rhyme: rhyme, verbForm: verbForm });
                else
                    res.render("find-failure", { word: word, detail: "Related-Words" });
            });
        } else {

            res.render("find-failure", { word: word, detail: "Related-Words" });
        }
    });

});

app.get("/random-word", function(req, res) {
    const apiKey = "a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
    const url = "https://api.wordnik.com/v4/words.json/randomWord?hasDictionaryDef=true&includePartOfSpeech=1&minLength=5&api_key=" + apiKey;
    https.get(url, function(response) {
        response.on("data", function(data) {
            const wordData = JSON.parse(data);
            word = wordData.word;
        });
        res.redirect("/random-word-find");

    });
});
app.get("/random-word-find", function(req, res) {
    const apiKey = "a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
    const urlAudio = "https://api.dictionaryapi.dev/api/v2/entries/en/" + word;
    https.get(urlAudio, function(response) {
        if (response.statusCode == 200) {
            response.on("data", function(data) {
                const wordData = JSON.parse(data);
                // const audioUrl = wordData[0].phonetics[0].text;
                if (word) res.render("words/word-audio-interface", { word: word });
                else {
                    res.render("find-failure-random", { word: word })
                }
            });
        } else {
            res.render("find-failure-random", { word: word });
            // res.render("words/word-audio-interface", { word: word });

        }
    });
})
app.get("/show-all-words", function(req, res) {
    res.render("words/show-all-words");
});
app.get("/word-of-the-day", function(req, res) {
    let todayWordPartsOfSpeech = [];
    let todayWordDefinitions = [];
    let todayWordDefinition = [];
    let todayWordExamples = [];
    let todayWordExample = [];
    var today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const date = today.getDate();
    let day = date + "-" + month + "-" + year
    var todayDate = new Date().toISOString().slice(0, 10);
    const apiKey = "a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
    const url = "https://api.wordnik.com/v4/words.json/wordOfTheDay?date=" + todayDate + "&api_key=" + apiKey;
    https.get(url, function(response) {
        response.on("data", function(data) {
            const wordData = JSON.parse(data);
            const todayWord = wordData.word;
            todayWordDefinition = wordData.definitions;
            todayWordDefinition.forEach(element => {
                todayWordPartsOfSpeech.push(element.partOfSpeech)
                todayWordDefinitions.push(element.text);
            })
            todayWordExample = wordData.examples;
            todayWordExample.forEach(element => {
                todayWordExamples.push(element.text);
            })
            const todayWordNote = wordData.note;
            res.render("word-of-the-day", { todayDate: day, todayWord: todayWord, todayWordPartsOfSpeech: todayWordPartsOfSpeech, todayWordDefinitions: todayWordDefinitions, todayWordExamples: todayWordExamples, todayWordNote: todayWordNote })
        })
    })
});
app.listen(process.env.PORT || 3000, function() {
    console.log("Server is running on port 3000");
});