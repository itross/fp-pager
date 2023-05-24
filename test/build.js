'use strict'

const Fastify = require('fastify')

module.exports = async function build (t) {
  const fastify = Fastify()
  t.teardown(fastify.close.bind(fastify))
  return fastify
}
