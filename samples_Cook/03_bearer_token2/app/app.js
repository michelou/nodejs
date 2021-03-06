'use strict'

var BodyParser = require('body-parser')
var Express = require('express')
var Passport = require('passport')

var BearerStrategy = require('passport-http-bearer').Strategy
var Crypto = require('crypto')
var LocalStrategy = require('passport-local').Strategy
var JSONWebToken = require('jsonwebtoken')

var users = {
  foo: {
    username: 'foo',
    password: 'bar',
    id: 1
  },
  bar: {
    username: 'bar',
    password: 'foo',
    id: 2
  }
}

var localStrategy = new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
},
function (username, password, done) {
  var user = users[username]
  if (user == null) {
    return done(null, false, { message: 'Invalid user' })
  }
  if (user.password !== password) {
    return done(null, false, { message: 'Invalid password' })
  }
  done(null, user)
})

Passport.use('local', localStrategy)

var verifyToken = function (token, done) {
  var payload = JSONWebToken.decode(token)
  var user = users[payload.username]
  // If we can't find a user, or the information
  // doesn't match then return false
  if (user == null ||
      user.id !== payload.id ||
      user.username !== payload.username) {
    return done(null, false)
  }
  // Ensure the token is valid now we have a user
  JSONWebToken.verify(token, user.secret, function (error, decoded) {
    if (error || decoded == null) {
      return done(error, false)
    }
    return done(null, user)
  })
}

Passport.use('bearer', new BearerStrategy(verifyToken))

var generateToken = function (user) {
  // The payload just contains the id of the user
  // and their username, we can verify whether the
  // claim is correct using JSONWebToken.verify
  var payload = {
    id: user.id,
    username: user.username
  }
  // Generate a random string
  // Usually this would be an app wide constant
  // But can be done both ways
  var secret = Crypto.randomBytes(128).toString('base64')

  // Create the token with a payload and secret
  var token = JSONWebToken.sign(payload, secret)
  // The user is still referencing the same object
  // in users, so no need to set it again
  // If we were using a database, we would save
  // it here
  user.secret = secret
  logInfo('generateToken: token=' + token)
  return token
}

var app = Express()
app.use(BodyParser.urlencoded({ extended: false }))
app.use(BodyParser.json())
app.use(Passport.initialize())

app.post(
  '/login',
  Passport.authenticate('local', { session: false }),
  function (request, response) {
    var user = request.user
    // Generate our token
    var token = generateToken(user)
    // Return the user a token to use
    response.send(token)
  }
)

app.get(
  '/userinfo',
  Passport.authenticate('bearer', { session: false }),
  function (request, response) {
    var user = request.user
    response.send({
      id: user.id,
      username: user.username
    })
  }
)

var port = require('../config.json').port

app.listen(port, function () {
  logInfo('Listening on port ' + port)
})

// ///////////////////////////////////////////////////////////////////////////
// Logging

const basename = require('path').basename(__filename)

var logInfo = function (msg) {
  var timestamp = require('moment')().format('YYYY-MM-DD HH:mm:ss')
  console.log('[' + timestamp + ' INFO] (' + basename + ') ' + msg)
}
