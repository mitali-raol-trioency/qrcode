'use strict'

import {mapValues, cartesianValues, create, search, slug, parseUrl} from '../../src/index'

describe('URL Generator', () => {
  let baseUrl
  let stringVal
  let arrayVal

  beforeEach(function () {
    baseUrl = 'http://www.google.com'
    stringVal = [
      {
        key: 'utm_campaign',
        value: 'google'
      }
    ]
    arrayVal = [
      {
        key: 'utm_campaign',
        value: [
          'google',
          'twitter',
          'facebook'
        ]
      }
    ]
  })

  afterEach(function () {
    baseUrl = null
    stringVal = null
    arrayVal = null
  })

  describe('slug', () => {
    it('should be a function', () => {
      expect(typeof slug).to.equal('function')
    })

    it('should be able to create a slug', () => {
      const result = slug('Hello World')
      expect(result).to.equal('hello-world')
    })
  })

  describe('mapValues', () => {
    it('should be a function', () => {
      expect(typeof mapValues).to.equal('function')
    })

    it('should be able to map a string value', () => {
      const result = mapValues(stringVal)
      expect(result[0][0]).to.equal('&utm_campaign=google')
    })

    it('should be able to map an array of strings', () => {
      const result = mapValues(arrayVal)
      expect(result[0][0]).to.equal('&utm_campaign=google')
      expect(result[0][1]).to.equal('&utm_campaign=twitter')
      expect(result[0][2]).to.equal('&utm_campaign=facebook')
    })

    it('should be able to character encode the values', () => {
      stringVal[0].value = 'Hello World'
      const result = mapValues(stringVal)
      expect(result[0][0]).to.equal('&utm_campaign=Hello%20World')
    })

    it('should be able to skip character encoding if true', () => {
      stringVal[0].skipEncoding = true
      stringVal[0].value = '{creativeID}'
      const result = mapValues(stringVal)
      expect(result[0][0]).to.equal('&utm_campaign={creativeID}')
    })

    it('should be able to deal with multiple values with mixed url encoding options', function () {
      arrayVal = [
        {
          key: 'utm_campaign',
          value: [
            {value: '{google}', skipEncoding: true},
            {value: '{twitter}', skipEncoding: false},
            {value: '{facebook}'}
          ]
        }
      ]

      const result = mapValues(arrayVal)
      expect(result[0][0]).to.equal('&utm_campaign={google}')
      expect(result[0][1]).to.equal('&utm_campaign=%7Btwitter%7D')
      expect(result[0][2]).to.equal('&utm_campaign=%7Bfacebook%7D')
    })
  })

  describe('cartesianValues', () => {
    let params

    beforeEach(function () {
      params = mapValues(stringVal)
    })

    afterEach(function () {
      params = null
    })

    it('should be a function', () => {
      expect(typeof cartesianValues).to.equal('function')
    })

    it('should return a generator', () => {
      const gen = cartesianValues(params)
      const vals = [...gen]
      expect(vals[0]).to.equal('&utm_campaign=google')
    })
  })

  describe('create', () => {
    it('should be a function', () => {
      expect(typeof create).to.equal('function')
    })

    it('should be able to create a list of unique urls', next => {
      create({
        url: baseUrl,
        params: arrayVal
      })
      .then(result => {
        expect(result[0]).to.equal(`${baseUrl}?utm_campaign=google`)
        expect(result[1]).to.equal(`${baseUrl}?utm_campaign=twitter`)
        expect(result[2]).to.equal(`${baseUrl}?utm_campaign=facebook`)
        next()
      })
      .catch(error => {
        next(error)
      })
    })

    it('should be able to handle an empty parameters array', next => {
      create({
        url: baseUrl,
        params: []
      })
      .then(result => {
        expect(result.length).to.equal(1)
        expect(result[0]).to.equal(`${baseUrl}`)
        next()
      })
      .catch(error => {
        next(error)
      })
    })

    it('should be able to cope with a url with existing parameters', next => {
      create({
        url: baseUrl + '?test=true',
        params: arrayVal
      })
      .then(result => {
        expect(result[0]).to.equal(`${baseUrl}?test=true&utm_campaign=google`)
        expect(result[1]).to.equal(`${baseUrl}?test=true&utm_campaign=twitter`)
        expect(result[2]).to.equal(`${baseUrl}?test=true&utm_campaign=facebook`)
        next()
      })
      .catch(error => {
        next(error)
      })
    })

    it('should be able to cope with a hash', next => {
      create({
        url: baseUrl + '/test?test=true#home',
        params: arrayVal
      })
      .then(result => {
        expect(result[0]).to.equal(`${baseUrl}/test?test=true&utm_campaign=google#home`)
        expect(result[1]).to.equal(`${baseUrl}/test?test=true&utm_campaign=twitter#home`)
        expect(result[2]).to.equal(`${baseUrl}/test?test=true&utm_campaign=facebook#home`)
        next()
      })
      .catch(error => {
        next(error)
      })
    })

    it('should be able to create a slug', next => {
      create({
        url: baseUrl + '?test=true',
        params: arrayVal,
        slug: 'Hello World!?!'
      })
      .then(result => {
        expect(result[0]).to.equal(`${baseUrl}/hello-world?test=true&utm_campaign=google`)
        expect(result[1]).to.equal(`${baseUrl}/hello-world?test=true&utm_campaign=twitter`)
        expect(result[2]).to.equal(`${baseUrl}/hello-world?test=true&utm_campaign=facebook`)
        next()
      })
      .catch(error => {
        next(error)
      })
    })

    it('should be able to to cope with localhost', next => {
      const url = 'http://localhost:8080'
      create({
        url: `${url}?test=true`,
        params: arrayVal,
        slug: 'Hello World!?!'
      })
      .then(result => {
        expect(result[0]).to.equal(`${url}/hello-world?test=true&utm_campaign=google`)
        expect(result[1]).to.equal(`${url}/hello-world?test=true&utm_campaign=twitter`)
        expect(result[2]).to.equal(`${url}/hello-world?test=true&utm_campaign=facebook`)
        next()
      })
      .catch(error => {
        next(error)
      })
    })
  })

  describe('search', () => {
    it('should be a function', () => {
      expect(typeof search).to.equal('function')
    })

    it('should be able to create a list of unique urls', next => {
      search(arrayVal)
      .then(result => {
        expect(result[0]).to.equal('?utm_campaign=google')
        expect(result[1]).to.equal('?utm_campaign=twitter')
        expect(result[2]).to.equal('?utm_campaign=facebook')
        next()
      })
      .catch(error => {
        next(error)
      })
    })
  })

  describe('parseUrl', function () {
    it('should be a function', () => {
      expect(typeof parseUrl).to.equal('function')
    })

    it('should be able to parse a url', () => {
      const result = parseUrl('http://www.google.com/home?test=true')
      expect(result.protocol).to.equal('http')
      expect(result.host).to.equal('www.google.com')
      expect(result.path).to.equal('/home')
      expect(result.query).to.equal('test=true')
      expect(result.queryKey.test).to.equal('true')
    })
  })
})
