let express = require('express');
let path = require('path');
let http = require('http');
let session = require("express-session");
let app = express();
const bodyParser = require('body-parser');
const port = 3000;
app.io = require('socket.io')();
let indexRouter = require('./routes/index')(app.io); // router met IO


// app.use(session(sessionConfig));
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));
app.use(express.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use("/assets/js/", express.static(path.join(__dirname, 'shared-javascript')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);


let server = http.createServer(app);
app.io.attach(server);

server.listen(port, () => {
    console.log("listening on port " + port);
});

server.on("error", () => {
    console.log("Something went wrong!");
});

module.exports = app;
