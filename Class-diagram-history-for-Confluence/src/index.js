import Resolver from '@forge/resolver';
import { parse, createVisitor } from 'java-ast';
import api, { route } from "@forge/api";


const resolver = new Resolver();
const { Octokit } = require("octokit");
const octokit = new Octokit({ auth: `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` });


resolver.define('getGitOwner', async () => {

  const { data } = await octokit.rest.users.getAuthenticated();

  console.log("from getGitOwner: login => " + JSON.parse(data).login);
  return JSON.parse(data).login;


})

resolver.define('getJiraBoards', async () =>{
  const response = await api.asApp().requestJira(route`/rest/api/3/project/search`, {
    headers: {
      'Accept': 'application/json'
    }
  });
  
  console.log(`Response: ${response.status} ${response.statusText}`);
  console.log(await response.json());

  return await response.json();

});

resolver.define('getJiraIssues', async (req) =>{
    const projectKey = req.payload.projectKey.value;
    console.log(projectKey);
    const routeSearch = `/rest/api/3/search?jql=project%20%3D%20`+ projectKey + `&expand=names`;
    console.log("route search " + routeSearch);
    //?jql=project%20%3D%20GCDC
    const response = await api.asApp().requestJira(route(routeSearch) , {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
        fields: ['issues', 'id', 'key', 'fields', 'created', 'summary', 'assignee', 'resolutiondate']
    });

    return await response.json();

});


resolver.define('getReposUserAuth', async () => {
  //console.log("GITHUB calling api");

  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    affiliation: "owner", //TODO: Also accept collaborator and organization
    visibility: "all",
    per_page: "100",
    page: "1",
  });

  const data_obj = JSON.parse(data);

  var reposNames = [];
  //console.log("Returning data");

  data_obj.forEach(element => {
    reposNames.push(element.name);
  });

  //console.log(reposNames);
  return reposNames;

});

resolver.define('getBranchesForRepo', async (req) => {

  //console.log("Getting Brancher For Repo");

  //console.log(req.payload.repoName.value);
  //console.log(req.payload.owner);


  const repoName = req.payload.repoName.value;
  const owner = req.payload.owner;

  const { data } = await octokit.rest.repos.listBranches({
    owner: owner,
    repo: repoName,
  });


  var repoBranchesWithSha = [];
  const data_obj = JSON.parse(data);
  //console.log("GIthub RepoBranches data parsed");

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

  //console.log("Files generating");
  //console.log(sha + owner + repo);
  //console.log(repo);

  const { data } = await octokit.rest.git.getTree({
    owner: owner,
    repo: repo,
    tree_sha: sha,
    recursive: "true"
  });

  const data_obj = JSON.parse(data);

  //console.log(data_obj);

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


/**
 * files obj structure:
 * [
 *  {
 *    label: 'string-file-path/',
 *    value: {
 *                path: 'string-file-path/',
 *                sha: 'file-sha' 
 *           }
 *  }
 * ]
 */
/**
 * req.payload.owner
 * req.payload.repo
 * req.payload.branch_sha
 * req.payload.files
 * req.payload.dateFrom
 * req.payload.dateTo
 */
resolver.define('processFormGetFiles', async (req)=>{

  const dateFrom = '2018-03-17T12:48:44Z';
  const dateTo = '2022-04-28T12:48:44Z';
  const owner = req.payload.owner;
  const repo = req.payload.repo;
  const files = req.payload.files;
  const branch_sha = req.payload.branch_sha;

  /*
  console.log(dateFrom);
  console.log(dateTo);
  console.log(owner);
  console.log(repo);
  console.log(files);
  console.log(branch_sha);
*/


  var commitsObj = await getCommitsWDateRange(owner, repo, branch_sha, dateFrom, dateTo);

  console.log("Number of Commits: " + commitsObj.length);

  var filesForCommitsObj = await getFilesForCommits(commitsObj, files, repo);



  //console.log("Calling static code analysis");
  //getAVisitor2point0(filesForCommitsObj[0].files_all.string);


  return filesForCommitsObj





});


resolver.define('analyseCommit', async (req)=>{


  const commit = req.payload.commitInfo;



  //File Changes and mapping
  var classesMapping = getFilesAndClasses(commit.filesArr);
  console.log("Calling Additions and Deletion Function");
  //var filesChanges = getCommitAdditionsAndDeletions(commit.owner, commit.repo, commit.commit_sha);


  console.log("calling github API");
  const { data } = await octokit.rest.repos.getCommit({//request('GET /repos/{owner}/{repo}/commits/{ref}', {
    owner: commit.owner,
    repo: commit.repo,
    ref: commit.commit_sha
  });


  console.log("called github API");
  const data_obj = JSON.parse(data);
  var fileChanges = [];

  if(data_obj.files !== undefined){
    console.log("making object from response");
    data_obj.files.forEach((file)=>{
      if(file.filename.split('.').pop() == 'java'){
        fileChanges.push(
          {
            filename: file.filename,
            sha: file.sha,
            changes: file.changes,
            additions: file.additions,
            deletions: file.deletions,
            status: file.status,
            commitAuthor: data_obj.commit.committer.name,
            commitAvatar: (data_obj.committer!=null ? data_obj.committer.avatar_url: ''),
            totals: (data_obj.stats? data_obj.stats : '')
          }
        );
      }

    });
  }



  console.log("returning invocation");
  

  //Mermaid static analysis
  console.log("Got this code" + commit.files_all.string);
  var mermaidCode = getAVisitor2point1(commit.files_all.string);



  return {mapping: classesMapping, changes: fileChanges, mermaid: mermaidCode};

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
      //console.log(response);
    });

  });
}

const getFileRaw = async (fileNamePath, ref, owner, repo) => {

  //console.log("Getting file with this input");
  //console.log(fileNamePath);
  //console.log(ref);
  //console.log(owner);
  //console.log(repo);

  var fileNotFound = false;

  const { data } = await octokit.rest.repos.getContent({
    mediaType: {
      format: "raw",
    },
    owner: owner,
    repo: repo,
    path: fileNamePath,
    ref: ref//The name of the commit/branch/tag. Default: the repository’s default branch (usually master)
  }).catch((err)=>{
    //console.warn("File not found " + fileNamePath);
    //console.warn(err);
    fileNotFound = true;
    return [{}];
  });




  if(fileNotFound){
    //console.log('File not found: ' + fileNamePath + ' -- Check index.js - the file probably does not exist.' )
    return null;

  }else{
    return data;
  }

  

}

const getCommitsWDateRange = async (owner, repo, sha_branch, since, until) => {

  const { data } = await octokit.rest.repos.listCommits({
    owner: owner,
    repo: repo,
    sha: sha_branch,
    since: since,
    until: until, 
    per_page: 15, 
  });


  const data_obj = JSON.parse(data);



  //console.log(data_obj);

  var commitsOutput = [];
  data_obj.forEach((commitObj) => {

    commitsOutput.push(
      { 
        sha: commitObj.sha, //commit sha: ex '6dcb09b5b57875f334f61aebed695e2e4193db5e'
        repo_owner: owner, //the owner of the repository
        date: commitObj.commit.committer.date, //date of commit: ex: '2011-04-14T16:00:49Z'
        message: commitObj.commit.message, //commit message: ex 'Fix all the bugs', 
        commiter_name: commitObj.commit.author.name, //commit author: ex 'Monalisa Octocat',
        commiter_email: commitObj.commit.author.email //commit author email: ex. 'support@github.com'
        
      }
    );
  })


  commitsOutput.sort((a,b)=>{
    return new Date(a.date) - new Date(b.date);
  });

  //console.log(commitsOutput);
  return commitsOutput;

}

/**
 * commitsObj: Object returned from GetCommitsWDateRange()
 * filesPaths: Object returned from user. Object structure: {file_path:'', repo:'', owner:''}
 */
const getFilesForCommits = async (commitsObj, filesPaths, repo ) => {

  //console.log("These are identified commits for the dates");
  //console.log(commitsObj);

  var FilesForCommitsObj = [];
  var files = [];
  //console.log("Entered getFilesfroCommits. filePathsObj");
  //console.log(filesPaths);
  
  for (const commitObj of commitsObj){

    for (const filePath of filesPaths.file){
      const rawFileCont = await getFileRaw(filePath.value.path, commitObj.sha, commitObj.repo_owner, repo);

        //console.log(rawFileCont);
        files.push(
          {
            sha: filePath.value.sha,
            path: filePath.value.path,
            raw: (rawFileCont !== null ? rawFileCont : '')
          }
        )

      

    }

    var files_raw = [];

    files.forEach((file)=>{
      files_raw.push(file.raw);
    })

    var files_all_string = '';
    files_all_string = files_all_string.concat(...files_raw);
    //console.log('This is how our files look');
    //console.log(files_all_string);

    FilesForCommitsObj.push(
      {
        commit_sha: commitObj.sha,
        date: commitObj.date,
        message: commitObj.message,
        owner: commitObj.repo_owner,
        repo: repo,
        commiter_name: commitObj.commiter_name,
        commiter_email: commitObj.commiter_email,
        files_all: {string: files_all_string},
        filesArr: files
      }
    );
    files = [];

    //console.log('This is the whole file object');
    //console.log(FilesForCommitsObj);

  }

  return FilesForCommitsObj;

}


/**
 * Get the additions and deletions of all the files in a commit.
 */
const getCommitAdditionsAndDeletions = async (owner, repo, commit_sha) =>{

  console.log("Additions function called");
  console.log(owner);
  console.log(repo);
  console.log(commit_sha);
  

  const { data } = await octokit.rest.repos.getCommit({//request('GET /repos/{owner}/{repo}/commits/{ref}', {
    owner: owner,
    repo: repo,
    ref: commit_sha
  });


  console.log("Parsing response");
  const data_obj = JSON.parse(data);

  console.log(data);
  fileChanges = [];
  console.log(data_obj.files);
  if(data_obj.files !== undefined){

    data_obj.files.forEach((file)=>{
      if(file.filename.split('.').pop() == 'java'){
        fileChanges.push(
          {
            filename: file.filename,
            sha: file.sha,
            changes: file.changes,
            additions: file.additions,
            deletions: file.deletions,
            status: file.status,
            commitAuthor: data_obj.commit.committer.name,
            commitAvatar: data_obj.committer.avatar_url
          }
        );
      }

    });
  }


  console.log("These are the fileChanges");
  console.log(fileChanges);

  return fileChanges;

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
  //console.log(req);

  return 'Hello, world!';
});



/**
 * 
 * @param {Array} filesArr : files array of objects
 * @description Takes a files object array and map the classes to files.
 * @returns {
 * classesAndFiles array
 * } 
 */
const getFilesAndClasses = (filesArr) => {

  var classesAndFiles = [];


  filesArr.forEach((file)=>{

    let ast = parse(file.raw);
    var classesNodes = [];

    const shallowSearch = createVisitor({ //Visitor to get All classes names and generalization

      visitClassDeclaration: (classDecl) => {
  
        if(classDecl.IDENTIFIER() !== undefined){
          classesNodes.push(classDecl.IDENTIFIER().text);
        }
      }
    }).visit(ast);

    classesAndFiles.push(
      {
        filePath: file.path,
        fileSha: file.sha,
        //fileRaw: file.raw
        fileClasses: classesNodes
      }
    );



  });

  return classesAndFiles;

}

//Static analyser ANTLR functions
const getAVisitor2point1 = (sourceCode) => {
  console.log("Creating Abstract syntax tree");
  let ast = parse(sourceCode);


  let classesFound = [];
  let classesFoundStr = [];
  let extended = [];
  let compositionCandidates = [];
  let agregation = [];
  let publicMethodGetters = [];


  //console.log("Shallow search BEGIN");
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
  //console.log(extended);
  //console.log(compositionCandidates);



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
              //console.log("This was found: " + methodDecl.text);
              //console.log( "The modifier is: " + activeModifier);
              //console.log("The method return type is: " + methodDecl.typeTypeOrVoid().text);

              if(methodDecl.typeTypeOrVoid().text !== ('void' || 'private')){
                publicMethodGetters.push({
                  className: visitedClassName,
                  modifier: activeModifier,
                  returnType: methodDecl.typeTypeOrVoid().text
                });
                //console.log("This class is not void or private - Composition relationship terminated");
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

  //console.log(publicMethodGetters);

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

    //console.log("These atributes will be checked");
    //console.log(atributesOfCandidateType);

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
  agregation = agregation.filter((agreg) => agreg.className[0] !== 'String' );
  agregation = agregation.filter((agreg) => {
    var returnVal = true;
    console.log("Checking aggregation");
    console.log(agreg);
    compositionCandidates.forEach((compositionCandidate)=>{

      if(agreg.nodeClass == compositionCandidate.inClass){
        console.log(agreg.nodeClass + " == " + compositionCandidate.inClass);
        agreg.className.forEach((classN) =>{
          if(classN == compositionCandidate.compositionedClas){
            console.log()
            if(compositionCandidate.verifiedCandidate){
              returnVal = false;
              return;
            }
          }
        });
      }
    });
    return returnVal;
  });
  //console.log(compositionCandidates);
  //console.log(agregation);


  //console.log('Classes list');
  //console.log(classesFound);
  //console.log('Classes string');
  //console.log(classesFoundStr);
  //console.log('Extended relationships');
  //console.log(extended);
  //console.log('Composition candidates');
  //console.log(compositionCandidates);
  //console.log('Aggregations');
  //console.log(agregation);
  //console.log('public method getters');
  //console.log(publicMethodGetters);

  //console.log('Hello\n');
  
  var stringl = 'Hello\nHow\nare';

  //console.log(stringl);


  const mermaidDiagramType = 'classDiagram-v2\n';
  const extendedMermaidArrow  = ' <|-- ';
  const compositionMermaidArrow = ' *-- ';
  const agregationMermaidArrow = ' o-- ';

  var mermaidInput = '';
  mermaidInput = mermaidInput.concat(mermaidDiagramType);

  classesFoundStr.forEach((className)=>{
    mermaidInput = mermaidInput.concat( 'class ', className, '\n');
  });

  extended.forEach((extendedRel)=>{
    mermaidInput = mermaidInput.concat(extendedRel.isExtendedBy, extendedMermaidArrow, extendedRel.className, '\n');
  });


  agregation.forEach((aggregRel) =>{
    aggregRel.className.forEach((aggregClassNames)=>{
      mermaidInput = mermaidInput.concat(aggregRel.nodeClass, agregationMermaidArrow, aggregClassNames, '\n');
    });
  });

  compositionCandidates.forEach((compositionCan) =>{
    if(compositionCan.verifiedCandidate == true){
      mermaidInput = mermaidInput.concat(compositionCan.inClass, compositionMermaidArrow, compositionCan.compositionedClas, '\n' );
    }
  });



  console.log(mermaidInput);
  return mermaidInput;

}



const getAVisitor2point0 = (sourceCode) => {
  console.log("Creating Abstract syntax tree");
  let ast = parse(sourceCode);


  let classesFound = [];
  let classesFoundStr = [];
  let extended = [];
  let compositionCandidates = [];
  let agregation = [];
  let publicMethodGetters = [];


  console.log("Shallow search BEGIN");
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

  console.log(classesFound);
  console.log(extended);
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
              //console.log("This was found: " + methodDecl.text);
              //console.log( "The modifier is: " + activeModifier);
              //console.log("The method return type is: " + methodDecl.typeTypeOrVoid().text);

              if(methodDecl.typeTypeOrVoid().text !== ('void' || 'private')){
                publicMethodGetters.push({
                  className: visitedClassName,
                  modifier: activeModifier,
                  returnType: methodDecl.typeTypeOrVoid().text
                });
                //console.log("This class is not void or private - Composition relationship terminated");
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
  console.log(agregation);

}

export const handler = resolver.getDefinitions();
