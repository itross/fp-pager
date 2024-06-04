'use strict'

const { test } = require('tap')
const build = require('./build.js')
const pagerPlugin = require('..')

const users = [
  { id: 1, username: 'frank.zappa' },
  { id: 2, username: 'warren.cuccurullo' },
  { id: 3, username: 'nacho.libre' },
  { id: 4, username: 'lou.ferrigno' },
  { id: 5, username: 'bus.spencer' },
  { id: 6, username: 'terence.hill' },
  { id: 7, username: 'frank.zappa' },
  { id: 8, username: 'warren.cuccurullo' },
  { id: 9, username: 'nacho.libre' },
  { id: 10, username: 'lou.ferrigno' },
  { id: 11, username: 'bus.spencer' },
  { id: 12, username: 'terence.hill' }
]

test('Should decorate request and response', async (t) => {
  t.plan(4)
  const app = await build(t)
  await app.register(pagerPlugin)

  app.get('/users', async (request, reply) => {
    t.ok(request.page)
    t.ok(reply.paged)
    return 'ok'
  })

  const response = await app.inject({
    method: 'GET',
    path: '/users'
  })

  t.equal(response.statusCode, 200)
  t.equal(response.body, 'ok')
})

test('Should decorate request and response without page query param', async (t) => {
  t.plan(5)
  const app = await build(t)
  await app.register(pagerPlugin)

  app.get('/users', async (request, reply) => {
    const page = request.page()
    t.equal(page.page, 0)
    t.equal(page.limit, 15)
    t.equal(page.offset, 0)
    return 'ok'
  })

  const response = await app.inject({
    method: 'GET',
    path: '/users'
  })

  t.equal(response.statusCode, 200)
  t.equal(response.body, 'ok')
})

test('Should return paged response with full links set', async (t) => {
  t.plan(17)
  const app = await build(t)
  await app.register(pagerPlugin)

  app.get('/users', async (request, reply) => {
    const page = request.page()
    t.ok(page)
    t.equal(page.page, 1)
    t.equal(page.size, 2)
    t.equal(page.limit, 2)
    t.equal(page.offset, 2)

    return reply.paged({ results: users.slice(page.offset + 1, page.limit + page.offset + 1), total: 12 })
  })

  const response = await app.inject({
    method: 'GET',
    path: '/users?page=2&size=2'
  })

  const paged = response.json()
  t.equal(response.statusCode, 200)
  t.ok(paged)
  t.ok(paged.page)
  t.ok(paged.results)

  t.equal(paged.page.items, 2)
  t.equal(paged.page.page, 2)
  t.equal(paged.page.total, 12)
  t.equal(paged.page.pages, 6)
  t.equal(paged.page.first, '/users?page=1&size=2')
  t.equal(paged.page.last, '/users?page=6&size=2')
  t.equal(paged.page.prev, '/users?page=1&size=2')
  t.equal(paged.page.next, '/users?page=3&size=2')
})

test('Should return paged response without the prev link', async (t) => {
  t.plan(16)
  const app = await build(t)
  await app.register(pagerPlugin)

  app.get('/users', async (request, reply) => {
    const page = request.page()
    t.ok(page)
    t.equal(page.page, 0)
    t.equal(page.size, 2)
    t.equal(page.limit, 2)
    t.equal(page.offset, 0)

    return reply.paged({ results: users.slice(page.offset + 1, page.limit + page.offset + 1), total: 12 })
  })

  const response = await app.inject({
    method: 'GET',
    path: '/users?page=1&size=2'
  })

  const paged = response.json()

  t.equal(response.statusCode, 200)
  t.ok(paged)
  t.ok(paged.page)
  t.ok(paged.results)

  t.equal(paged.page.items, 2)
  t.equal(paged.page.page, 1)
  t.equal(paged.page.total, 12)
  t.equal(paged.page.pages, 6)
  t.equal(paged.page.first, '/users?page=1&size=2')
  t.equal(paged.page.last, '/users?page=6&size=2')
  t.equal(paged.page.next, '/users?page=2&size=2')
})

test('Should return paged response without the next link', async (t) => {
  t.plan(16)
  const app = await build(t)
  await app.register(pagerPlugin)

  app.get('/users', async (request, reply) => {
    const page = request.page()
    t.ok(page)
    t.equal(page.page, 4)
    t.equal(page.size, 2)
    t.equal(page.limit, 2)
    t.equal(page.offset, 8)

    return reply.paged({ results: users.slice(page.offset + 1, page.limit + page.offset + 1), total: 12 })
  })

  const response = await app.inject({
    method: 'GET',
    path: '/users?page=5&size=2'
  })

  const paged = response.json()

  t.equal(response.statusCode, 200)
  t.ok(paged)
  t.ok(paged.page)
  t.ok(paged.results)

  t.equal(paged.page.items, 2)
  t.equal(paged.page.page, 5)
  t.equal(paged.page.total, 12)
  t.equal(paged.page.pages, 6)
  t.equal(paged.page.first, '/users?page=1&size=2')
  t.equal(paged.page.last, '/users?page=6&size=2')
  t.equal(paged.page.prev, '/users?page=4&size=2')
})

test('Should decorate request and response even with page and size params as strnigs', async (t) => {
  t.plan(4)
  const app = await build(t)
  await app.register(pagerPlugin)

  app.get('/users', async (request, reply) => {
    t.ok(request.page)
    t.ok(reply.paged)
    return 'ok'
  })

  const response = await app.inject({
    method: 'GET',
    path: '/users?page="6"&size="2"'
  })

  t.equal(response.statusCode, 200)
  t.equal(response.body, 'ok')
})
