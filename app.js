const express = require('express');
var winston = require('winston'); // for transports.Console
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('./logger');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const index = require('./routes/index');
const auth = require('./routes/auth');
const users = require('./routes/users');
const fleets = require('./routes/fleets');
const devices = require('./routes/devices');
const journeys = require('./routes/journeys');
const logs = require('./routes/logs');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(require('morgan')({ "stream": logger.stream }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(auth.passport);
app.use(auth.ejwt);
app.use(auth.addAccountToRequest);
app.use('/auth', auth.router);


app.use('/', index);
app.use('/user', users);
app.use('/fleet', fleets);
app.use('/device', devices);
app.use('/journey', journeys);
app.use('/log', logs);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
