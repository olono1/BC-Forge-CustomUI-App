import Resolver from '@forge/resolver';

const resolver = new Resolver();
const { Octokit } = require("octokit");
const octokit = new Octokit({ auth: `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` });



resolver.define('getReposUserAuth', async () => {
  console.log("GITHUB calling api");

  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    affiliation: "owner", //TODO: Also accept collaborator and organization
    visibility: "all",
    per_page: "100",
    page: "1",
  });

  const data_obj = JSON.parse(data);

  var reposNames = [];
  console.log("Returning data");

  data_obj.forEach(element => {
    reposNames.push(element.name);
  });

  console.log(reposNames);
  return reposNames;

});



resolver.define('getText', (req) => {
  console.log(req);

  return 'Hello, world!';
});

export const handler = resolver.getDefinitions();
