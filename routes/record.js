const express = require('express')
const router = express.Router()
const db = require('../models')
const Record = db.Record
const User = db.User
const { getTotal } = require('../expense-tracker')
const { authenticated } = require('../config/auth')


// 取得新增頁面
router.get('/new', authenticated, (req, res) => {
  res.render('new')
})

// 執行新增一筆資料  
router.post('/', authenticated, (req, res) => {
  const { name, category, date, amount, merchant } = req.body

  let errors = []
  if (!name) { errors.push({ message: '消費名稱不可空白' }) }
  if (!date) { errors.push({ message: '消費日期不可空白' }) }
  if (!amount) { errors.push({ message: '消費金額不可空白' }) }
  if (errors.length > 0) {
    return res.render('new', { errors })
  }

  const record = new Record({
    name,
    category,
    date,
    amount,
    merchant,
    UserId: req.user.id
  })
  record.save()
    .then(record => res.redirect('/'))
    .catch(err => console.log(err))
})

// 瀏覽全部資料
router.get('/', authenticated, (req, res) => {

  User.findByPk(req.user.id)
    .then(user => {
      if (!user) throw new Error('user not found')

      return Record.findAll({
        raw: true,
        nest: true,
        where: { UserId: req.user.id }
      })
    })
    .then(records => {
      for (record of records) {

        const getTime = record.date
        record.date = getTime.toLocaleDateString()
      }
      return res.render('index', { records, totalAmount: getTotal(records) })
    })
    .catch(error => { return res.status(422).json(error) })

})

// 取得修改頁面
router.get('/:id/edit', authenticated, (req, res) => {

  User.findByPk(req.user.id)
    .then(user => {
      if (!user) throw new Error('user not found')

      return Record.findOne({
        raw: true,
        nest: true,
        where: {
          UserId: req.user.id,
          Id: req.params.id
        }
      })
    })
    .then(record => {
      const getTime = record.date
      record.date = getTime.toLocaleDateString()
      return res.render('edit', { record })
    })
    .catch(error => { return res.status(422).json(error) })

})

// 修改一筆資料
router.put('/:id', authenticated, (req, res) => {
  const { name, date, category, amount, merchant } = req.body
  let errors = []
  if (!name) { errors.push({ message: '消費名稱不可空白' }) }
  if (!date) { errors.push({ message: '消費日期不可空白' }) }
  if (!amount) { errors.push({ message: '消費金額不可空白' }) }
  if (errors.length > 0) {
    let record = req.body
    record.id = req.params.id
    return res.render('edit', { record, errors })
  }
  Record.findOne({
    where: {
      UserId: req.user.id,
      Id: req.params.id
    }
  }).then(record => {

    record.name = name
    record.date = date
    record.category = category
    record.amount = amount
    record.merchant = merchant
    return record.save()
  })
    .then(record => res.redirect('/'))
    .catch(error => res.status(422).json(error))
})

// 刪除一筆資料
router.delete('/:id', authenticated, (req, res) => {

  User.findByPk(req.user.id)
    .then(user => {
      if (!user) throw new Error("user not found")

      return Record.destroy({
        where: {
          UserId: req.user.id,
          Id: req.params.id
        }
      })
    })
    .then((record) => { return res.redirect('/') })
    .catch((error) => { return res.status(422).json(error) })

})


module.exports = router