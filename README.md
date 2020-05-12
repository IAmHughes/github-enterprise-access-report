# User access Report for GitHub Enterprise

This Node script can be used on GitHub Enterprise (Server or Cloud) to get a specific user's access report for repositories.
It will return a `.csv` file with a report of *all repositories* the user has access towards, and what *level of access*. It **requires** a GitHub Personal Access Token with the following scopes on a user that is an **organization owner** for every organization in the Enterprise:
  - `admin:enterprise`
  - `admin:org`
  - `admin:repo`

## How to run
- Install the node modules
  - `npm install`
- Create `.env` with needed variables based on `.env.example`
- Run the script and define the user
  - `node user-access-report.js --user <someUserHandle>`

## Report layout
Once the script has run to completion, you will be presented with a report in the format:
```csv
Organization,Repository,Level of Access
org1,repo1,triage
org1,repo2,read
org2,repo1,write
org2,repo2,admin
SomeOtherOrg,someRepo,maintain
...
```
## Caveats
This script requires that the `GITHUB_TOKEN` provided have the scopes listed above, and the user creating the token needs to be an organization owner of **every** organization in the Enterprise.
