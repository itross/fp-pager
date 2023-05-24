'use strict'

const fp = require('fastify-plugin')

const DEFAULT_PAGE_PARAM = 'page'
const DEFAULT_PAGE_SIZE_PARAM = 'size'
const DEFAULT_SORT_FIELD_PARAM = 'sort'
const DEFAULT_SORT_DIRECTION_PARAM = 'dir'
const DEFAULT_PAGE_SIZE = 15
const DEFAULT_SORT_FIELD = 'id'
const DEFAULT_SORT_DIR = 'asc'

function sanitize (page, size) {
  page = typeof page === 'number' ? page : parseInt(page, 0)
  size = typeof size === 'number' ? size : parseInt(size, 0)

  --page

  if (isNaN(page) || page < 0) {
    page = 0
  }

  if (isNaN(size) || size < 1) {
    size = DEFAULT_PAGE_SIZE
  }

  return {
    page,
    size
  }
}

function createPagingParser (opts) {
  const pageParam = opts.pageParam || DEFAULT_PAGE_PARAM
  const pageSizeParam = opts.pageSizeParam || DEFAULT_PAGE_SIZE_PARAM
  const sortField = opts.sortFieldParam || DEFAULT_SORT_FIELD_PARAM
  const sortDirection = opts.sortDirectionParam || DEFAULT_SORT_DIRECTION_PARAM

  return function () {
    const query = this.query || {}

    const paging = {
      ...sanitize(query[pageParam], query[pageSizeParam])
    }

    paging.sort = query[sortField] || DEFAULT_SORT_FIELD
    paging.dir = query[sortDirection] || DEFAULT_SORT_DIR

    return paging
  }
}

function createPagedResponseGenerator (opts) {
  const pageParam = opts.pageParam || DEFAULT_PAGE_PARAM
  const pageSizeParam = opts.pageSizeParam || DEFAULT_PAGE_SIZE_PARAM

  return function ({ results, total }) {
    const reply = this
    const { request } = reply
    const query = request.query || {}
    const { page, size } = sanitize(query[pageParam], query[pageSizeParam])
    const pages = Math.ceil(total / size)

    const prevPage = page
    const nextPage = page + 2

    const requestBaseUrl = request.url.split('?')[0]
    const first = `${requestBaseUrl}?${pageParam}=1&${pageSizeParam}=${size}`
    const last = `${requestBaseUrl}?${pageParam}=${pages}&${pageSizeParam}=${size}`
    const paged = {
      page: {
        items: size,
        page: page + 1,
        total,
        pages,
        first,
        last
      },
      results
    }

    if (prevPage >= 1) {
      paged.page.prev = `${requestBaseUrl}?${pageParam}=${prevPage}&${pageSizeParam}=${size}`
    }

    if (nextPage < pages) {
      paged.page.next = `${requestBaseUrl}?${pageParam}=${nextPage}&${pageSizeParam}=${size}`
    }

    if (prevPage < 1) {
      delete paged.prev
    }

    if (nextPage >= pages) {
      delete paged.next
    }

    reply.send(paged)
  }
}

async function pagerPlugin (fastify, opts) {
  fastify.decorateRequest('page', createPagingParser(opts))
  fastify.decorateReply('paged', createPagedResponseGenerator(opts))
}

module.exports = fp(pagerPlugin, {
  fastify: '>=4.0.0',
  name: '@itross/fp-pager'
})
