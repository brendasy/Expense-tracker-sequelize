const LocalStrategy = require('passport-local').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const db = require('../models')
const User = db.User
const bcrypt = require('bcryptjs')

module.exports = (passport) => {

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      (username, password, done) => {
        User.findOne({ where: { email: username } })
          .then(user => {
            if (!user) { return done(null, false, { message: '此Email尚未註冊' }) }

            bcrypt.compare(password, user.password, (err, isMatch) => {
              if (err) throw err
              if (isMatch) {
                return done(null, user)
              } else {
                return done(null, false, { message: '密碼輸入有誤' })
              }
            })
          })
      }
    ))

  passport.use(
    new FacebookStrategy({
      clientID: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK,
      profileFields: ['displayName', 'email']
    },
      (accessToken, refreshToken, profile, done) => {
        User.findOne({ where: { email: profile._json.email } })
          .then(user => {
            if (!user) {
              var newUser = new User({ email: profile._json.email, name: profile._json.name })

              var randomPassword = Math.random().toString(36).slice(-8)
              bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(randomPassword, salt, (err, hash) => {
                  if (err) throw err
                  newUser.password = hash

                  newUser.save().then(user => {
                    return done(null, user)
                  }).catch(err => console.log(err))

                })
              })
            } else {
              return done(null, user)
            }
          })
      }
    ))

  passport.serializeUser(function (user, done) {
    done(null, user.id)
  });

  passport.deserializeUser(function (id, done) {
    User.findByPk(id)
      .then(user => {
        user = user.get()
        done(null, user)
      })
  })
}