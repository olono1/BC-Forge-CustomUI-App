import Resolver from '@forge/resolver';
import { parse, createVisitor } from 'java-ast';


const resolver = new Resolver();
const { Octokit } = require("octokit");
const octokit = new Octokit({ auth: `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` });


resolver.define('getGitOwner', async () => {

  const { data } = await octokit.rest.users.getAuthenticated();

  console.log("from getGitOwner: login => " + JSON.parse(data).login);
  return JSON.parse(data).login;


})


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

resolver.define('getBranchesForRepo', async (req) => {

  console.log("Getting Brancher For Repo");

  console.log(req.payload.repoName.value);
  console.log(req.payload.owner);


  const repoName = req.payload.repoName.value;
  const owner = req.payload.owner;

  const { data } = await octokit.rest.repos.listBranches({
    owner: owner,
    repo: repoName,
  });


  var repoBranchesWithSha = [];
  const data_obj = JSON.parse(data);
  console.log("GIthub RepoBranches data parsed");

  data_obj.forEach(element => {
    var branchObj = {
      name: element.name,
      sha: element.commit.sha
    };

    repoBranchesWithSha.push(branchObj);

  });

  return repoBranchesWithSha;


});

resolver.define('getFilesFromBranch', async (req)=>{

  const sha = req.payload.sha;
  const owner = req.payload.gitOwner;
  const repo = req.payload.repoSelected;

  console.log("Files generating");
  console.log(sha + owner + repo);
  console.log(repo);

  const { data } = await octokit.rest.git.getTree({
    owner: owner,
    repo: repo,
    tree_sha: sha,
    recursive: "true"
  });

  const data_obj = JSON.parse(data);

  console.log(data_obj);

  var filesReponse = [];

  data_obj.tree.forEach(element => {
    if(element.type == 'blob'){
      var fileObj = {
        path: element.path,
        sha: element.sha,
      };
      filesReponse.push(fileObj);
    }

  });

  return filesReponse;
});



const getCommitDate = async (repon_name, ref, owner) => {

  const { data } = await octokit.rest.repos.getCommit({
    owner: owner, //repo owner
    repo: repon_name, //repository name
    ref: ref, //the file/branch/commit sha
  });

  
  return data.commit.committer.date;
}

const getAllCommitsForFile = async (owner, repo, fileNameWExtension) => {


  const { data } =  await octokit.request('GET /repos/{owner}/{repo}/commits?path={file_path}', {
    owner: owner,
    repo: repo,
    file_path: fileNameWExtension
  })

  const shaArr = [];

  data.forEach((commit) => {
    shaArr.push(commit.sha);
  });


  shaArr.forEach( async (sha) => {


    getFileRaw(fileNameWExtension, sha).then((response) => {
      console.log(response);
    });

  });
}





  //Req Variables:
  /**
   * req.filesToAnalyse
   * req.dateStart
   * req.dateEnd
   * req.repo
   * req.branch
   * 
   * 
   */

resolver.define('getDiagramMermaid', async (req) => {



});



resolver.define('getText', (req) => {
  console.log(req);

  return 'Hello, world!';
});





//Static analyser ANTLR functions

const getAVisitor2point0 = (sourceCode) => {
  let ast = parse(sourceCode);


  let classesFound = [];
  let classesFoundStr = [];
  let extended = [];
  let compositionCandidates = [];
  let agregation = [];
  let publicMethodGetters = [];


  const shallowSearch = createVisitor({ //Visitor to get All classes names and generalization

    visitClassDeclaration: (classDecl) => {

      if(classDecl.IDENTIFIER() !== undefined){
        classesFound.push({className: classDecl.IDENTIFIER().text});
        classesFoundStr.push(classDecl.IDENTIFIER().text);

        if(classDecl.typeType() !== undefined){
          extended.push({
            className: classDecl.IDENTIFIER().text,
            isExtendedBy: classDecl.typeType().text
          })
        }
      }
    }
  }).visit(ast);


  createVisitor({ //Get all atributes of classes, get composition Canditdates

    visitClassDeclaration:(classDecl) => {
      createVisitor({
        visitExpression: (expression) => {
          createVisitor({
            visitCreator: (creator) => {
              if(classesFoundStr.includes(creator.createdName().text)){ //If the class is part of the analysed classes only then mark it as a composition candidate
                compositionCandidates.push({
                  inClass: classDecl.IDENTIFIER().text,
                  compositionedClas: creator.createdName().text,
                  verifiedCandidate: false
                });
              } 
            }
          }).visit(expression);
        }
      }).visit(classDecl);
    }


  }).visit(ast);

  //console.log(classesFound);
  //sconsole.log(extended);
  console.log(compositionCandidates);



  createVisitor({
    visitClassDeclaration: (classDecl) => {

      var visitedClassName = classDecl.IDENTIFIER().text;
      
      
      var currentModifier = "package-private";
      //console.log("visitClassDeclaration " + classDecl.text); //The whole class gets printed runs for every class
      createVisitor({
        visitMemberDeclaration: (memberDecl) => {
          var atributeObj = {};
          atributeObj.nodeClass = visitedClassName;
          var activeModifier;
          createVisitor({
            visitModifier: (modifier) =>{
              activeModifier = modifier.text;
              //console.log("---- " + modifier.text);
            }
          }).visit(memberDecl._parent);


          createVisitor({
            visitMethodDeclaration: (methodDecl) => {
              console.log("This was found: " + methodDecl.text);
              console.log( "The modifier is: " + activeModifier);
              console.log("The method return type is: " + methodDecl.typeTypeOrVoid().text);

              if(methodDecl.typeTypeOrVoid().text !== ('void' || 'private')){
                publicMethodGetters.push({
                  className: visitedClassName,
                  modifier: activeModifier,
                  returnType: methodDecl.typeTypeOrVoid().text
                });
                console.log("This class is not void or private - Composition relationship terminated");
              }
            }
          }).visit(memberDecl)


          //console.log(memberDecl.text);
          createVisitor({
            visitFieldDeclaration: (fieldDeclarations)=>{
              var atributeClassType = [];
              var atributeNames = [];
              //console.log(fieldDeclarations.text);

              if(fieldDeclarations.typeType() !== undefined && fieldDeclarations.typeType().classOrInterfaceType() !== undefined){

                fieldDeclarations.variableDeclarators().variableDeclarator().forEach((declarator) => {
                  atributeNames.push(declarator.variableDeclaratorId().IDENTIFIER().text);
                  //console.log("name " + declarator.variableDeclaratorId().IDENTIFIER().text);
                })

                if(fieldDeclarations.typeType().classOrInterfaceType().typeArguments().length > 0){
                  fieldDeclarations.typeType().classOrInterfaceType().typeArguments().forEach((argument) => {
                    createVisitor({
                      visitTypeArgument: (typeArgument) => {
    
                        if(typeArgument.typeType().classOrInterfaceType() !== undefined){
                          //console.log("Modifier Current " + currentModifier);
                          atributeClassType.push(typeArgument.typeType().classOrInterfaceType().text)
                          //console.log(typeArgument.typeType().classOrInterfaceType().text);
                        }
    
                        
                      }
                    }).visit(argument);
                  });
                }else{
                  atributeClassType.push(fieldDeclarations.typeType().classOrInterfaceType().text);
                  //console.log(fieldDeclarations.typeType().classOrInterfaceType().text);
                }
              }

              atributeObj.className = atributeClassType;
              atributeObj.modifier = activeModifier;
              atributeObj.atributeName = atributeNames;
              agregation.push(atributeObj);
            }
          }).visit(memberDecl)
        }
      }).visit(classDecl)

      

    }
  }).visit(ast)

  console.log(publicMethodGetters);

  compositionCandidates.forEach((candidate) =>{
    var atributesOfCandidateClass = agregation.filter((atribute) => atribute.nodeClass === candidate.inClass);

    var atributesOfCandidateType = atributesOfCandidateClass.filter((atribute) => {
      var keepAtribute = false;
      atribute.className.forEach((className)=>{
        if(className === candidate.compositionedClas){
          keepAtribute = true;
        }
      })
      return keepAtribute;
    })

    console.log("These atributes will be checked");
    console.log(atributesOfCandidateType);

    var candidatePassed = true;
    atributesOfCandidateType.forEach((atributeForCandidate) => {
      if(atributeForCandidate.modifier !== 'private'){
        candidatePassed = false;
      }
    })

    publicMethodGetters.forEach((methodOponent) => {
      //console.log("START");
      //console.log(candidate);
      //console.log(methodOponent);
      //console.log("Checking composition candidate " + candidate + "oponent: " + methodOponent);
      if(methodOponent.className === candidate.inClass){
        //console.log("oponent Class : " + methodOponent.className + " === " + candidate.inClass + ": candidate Class") 
        if(methodOponent.modifier !== ('private' || 'void')){
          //console.log("oponent modifier is NOT private OR void");
            if(candidate.compositionedClas === methodOponent.returnType){
              //console.log("atribute type in class " + candidate.inClass + " is: " + candidate.compositionedClas + " and matches the oponent return type " + methodOponent.returnType);
              candidatePassed = false;
              //console.log('Composition verrification result: rejected');
            }
        }
      }
    });

    candidate.verifiedCandidate = candidatePassed;

  })

  agregation = agregation.filter((agreg) => agreg.className.length > 0);
  console.log(compositionCandidates);
  //console.log(agregation);

}

export const handler = resolver.getDefinitions();
