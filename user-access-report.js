require('dotenv').config()
const argv = require('yargs').argv
let { graphql } = require('@octokit/graphql')
graphql = graphql.defaults({
  baseUrl: process.env.GITHUB_API_URL,
  headers: {
    authorization: `token ${process.env.GITHUB_TOKEN}`
  }
})
