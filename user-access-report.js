require('dotenv').config()
const argv = require('yargs').argv
const fs = require('fs')
let { graphql } = require('@octokit/graphql')
graphql = graphql.defaults({
  baseUrl: process.env.GITHUB_ENDPOINT,
  headers: {
    authorization: `token ${process.env.GITHUB_TOKEN}`
  }
})
const outputBaseFolder = process.env.OUTPUT_FOLDER

// Full path and name of output file to create
const outputFile = `${outputBaseFolder}/user-${argv.user}-report-${Date.now()}.csv`

if (argv.user.length > 0) {
  createCSV()
  getUserAccess()
} else {
  console.log('Invalid options passed\n')
  console.log('To use this script, you must specify a user: ')
  console.log('node user-access-report.js --user <username>\n')
}

async function getUserAccess () {
  let paginationOrg = null
  let paginationRepo = null
  const query =
    `query ($enterprise: String! $user: String! $cursorOrg: String $cursorRepo: String) {
  enterprise(slug: $enterprise) {
    organizations(first: 100 after: $cursorOrg) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        login
        repositories(first:100 after: $cursorRepo) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            name
            collaborators(first:1 query: $user){
              edges {
                permission
                node {
                  login
                }
              }
            }
          }
        }
      }
    }
  }
}`
  try {
    let hasNextPageOrg = false
    let hasNextPageRepo = false
    let getUserAccessResult = null
    do {
      do {
        getUserAccessResult = await graphql({
          query,
          enterprise: process.env.ENTERPRISE,
          user: argv.user,
          cursorOrg: paginationOrg,
          cursorRepo: paginationRepo
        })

        hasNextPageOrg = getUserAccessResult.enterprise.organizations.pageInfo.hasNextPage
        const orgsObj = getUserAccessResult.enterprise.organizations.nodes
        let orgNode = 0

        for (const org of orgsObj) {
          const reposObj = getUserAccessResult.enterprise.organizations.nodes[orgNode].repositories.nodes
          hasNextPageRepo = getUserAccessResult.enterprise.organizations.nodes[orgNode].repositories.pageInfo.hasNextPage
          if (Object.keys(reposObj).length > 0) {
            for (const repo of reposObj) {
              const orgName = org.login
              const repoName = repo.name
              const accessLevel = repo.collaborators.edges[0].permission
              addToCSV(orgName, repoName, accessLevel.toLowerCase())
            }

            if (hasNextPageRepo) {
              paginationRepo = getUserAccessResult.enterprise.organizations.nodes[orgNode].repositories.pageInfo.endCursor
            } else {
              paginationRepo = null
            }
          }
          orgNode++
        }
      } while (hasNextPageRepo)
      if (hasNextPageOrg) {
        paginationOrg = getUserAccessResult.enterprise.organizations.pageInfo.endCursor
      }
    } while (hasNextPageOrg)
  } catch (error) {
    console.log('Request failed:', error.request)
    console.log(error.message)
    console.log(error)
  }
}

function createCSV () {
  if (!fs.existsSync(outputBaseFolder)) {
    fs.mkdirSync(outputBaseFolder)
  }
  const header = 'Organization,Repository,AccessLevel'
  fs.appendFileSync(outputFile, header + '\n', err => {
    if (err) return console.log(err)
  })
}

function addToCSV (org, repo, access) {
  fs.appendFileSync(outputFile, `${org},${repo},${access}\n`)
}
