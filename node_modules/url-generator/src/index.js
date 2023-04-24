'use strict'

/**
 * Options for the url parser method
 */
const parseOptions = {
  // eslint-disable-next-line
  regex: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
  query: /(?:^|&)([^&=]*)=?([^&]*)/g,
  key: [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host',
    'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor', 'hash'
  ]
}

/**
 * Parses into an object of differnt url parts
 *
 * useage:
 *  const url = parseUrl('http://www.google.com')
 *  console.log(url.host)
 *  console.log(url.protocol)
 *
 *  // www.google.com
 *  // http
 *
 * @export
 * @param {String} url
 * @return {Object}
 */
export function parseUrl(url) {
  const key = parseOptions.key
  const match = parseOptions.regex.exec(url)
  let uri = {}
  let i = 14
  while (i--) uri[key[i]] = match[i] || ''
  uri.queryKey = {}
  uri[key[12]].replace(parseOptions.query, ($0, $1, $2) => {
    if ($1) uri.queryKey[$1] = $2
  })
  return uri
}

/**
 * Returns a multidimensional array containing all url parameters with both
 * the key and value ready to add to a url
 *
 * @export
 * @param {Array} arr
 * @return {Array}
 */
export function mapValues(arr) {
  return arr.map(param => {
    const res = Array.isArray(param.value) ? param.value : [param.value]
    return res.map(value => {
      let {skip, val} = returnValues(value, param)
      let v = skip ? val : encodeURIComponent(val)
      return `&${param.key}=${v}`
    })
  })
}

/**
 * Returns the value and the skip endcoding property
 * 
 * @export
 * @param {String|Object} value
 * @param {Object} param
 * @return {Object}
 */
export function returnValues(value, param) {
  let skip
  let val

  if (Object.prototype.toString.call(value) === '[object Object]') {
    val = value.value
    skip = value.skipEncoding
  } else {
    val = value
    skip = param.skipEncoding
  }

  return {skip, val}
}

/**
 * Creates a generator which returns all the different permutations of the
 * query strings for the given parameters
 *
 * @export
 * @param {Array} arr
 * @return {Generator}
 */
export function cartesianValues(arr) {
  const data = new Array(arr.length)
  return (function *recursive(pos) {
    if (pos === arr.length) yield data.join('')
    else for (let i = 0; i < arr[pos].length; ++i) {
      data[pos] = arr[pos][i]
      yield* recursive(pos + 1)
    }
  }(0))
}

/**
 * Creates unique urls for all permutations of the given parameters
 *
 * useage:
 *
 *  create({
 *    url: 'http://www.google.com',
 *    params: [
 *      {
 *        key: 'utm_campaign',
 *        value: [
 *          'google',
 *          'facebook',
 *          'twitter'
 *        ]
 *      }
 *    ]
 *  }).then(result => {
 *    console.log(result)
 *  }).catch(error => {
 *    console.log(error)
 *  })
 *
 *  // urls[
 *  //  'http://www.google.com?utm_campaign=facebook',
 *  //  'http://www.google.com?utm_campaign=facebook',
 *  //  'http://www.google.com?utm_campaign=facebook'
 *  // ]
 *
 * @export
 * @param {Object} options - The options for the url to build
 * @return {Array} - The unique list of generated URL's
 */
export async function create(options) {
  const {url, params, slug} = options
  const urlDetails = parseUrl(url)
  unshiftParams(params, urlDetails.queryKey)
  return [...cartesianValues(mapValues(params))].map(i => {
    return makeUrl(i.replace('&', '?'), urlDetails, slug)
  })
}

/**
 * Creates unique search strings for all permutations of the given parameters
 *
 * useage:
 *
 *  search([
 *    {
 *      key: 'utm_campaign',
 *      value: [
 *        'google',
 *        'facebook',
 *        'twitter'
 *      ]
 *    }
 *  ]).then(result => {
 *    console.log(result)
 *  }).catch(error => {
 *    console.log(error)
 *  })
 *
 *  // urls[
 *  //  '?utm_campaign=facebook',
 *  //  '?utm_campaign=facebook',
 *  //  '?utm_campaign=facebook'
 *  // ]
 *
 * @export
 * @param {Object} options - The options for the url to build
 * @return {Array} - The unique list of generated URL's
 */
export async function search(params) {
  return [...cartesianValues(mapValues(params))].map(i => {
    return i.replace('&', '?')
  })
}

/**
 * Creates a valid slug value for a url from a string
 *
 * useage:
 *  console.log(urlGenerator.slug('Hello World'))
 *
 *  // 'hello-world'
 *
 * @export
 * @param {String} value - The string to slugify
 * @return {String}
 */
export function slug(value) {
  return value.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

/**
 * Makes a url from the given search string the url object and an
 * optional slug
 *
 * @param {String} search
 * @param {Object} url
 * @param {String} str
 * @return {String}
 */
function makeUrl(search, opts, str) {
  const {protocol, host, path, source, port} = opts
  let parts = []
  parts.push(protocol)
  parts.push('://')
  parts.push(host)
  parts.push(port ? ':' + port : '')
  parts.push(makeSlug(path, str))
  parts.push(search)
  parts.push(getHash(source))
  return parts.join('')
}

/**
 * Makes a slug from the given path and slug value
 *
 * @param {String} path
 * @param {String} str
 * @return {String}
 */
function makeSlug(path, str) {
  let res = ''
  if (path && path.length > 0) res += path
  if (str && str.length > 0) res += '/' + slug(str)
  return res.length > 0 ? res : res
}

/**
 * Returns the hash fragment for a url if it exists
 *
 * @param {String} url
 * @return {String}
 */
function getHash(url) {
  const idx = url.indexOf('#')
  let res = ''
  if (idx !== -1) res += url.substring(idx)
  return res
}

/**
 * Unshifts the params array adding in the query parameters taken
 * from the base url
 *
 * @param {Array} params
 * @param {Object} query
 */
function unshiftParams(params, query) {
  for (let key in query) {
    /* istanbul ignore else */
    if (query.hasOwnProperty(key)) {
      params.unshift({key, value: [query[key]]})
    }
  }
}

/**
 * Expose the public api
 */
export default {
  mapValues,
  cartesianValues,
  create,
  search,
  slug,
  parseUrl
}
