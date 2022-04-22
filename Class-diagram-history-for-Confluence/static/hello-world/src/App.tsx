import React, { Fragment, useEffect, useRef, useState } from 'react';
import { css, jsx } from '@emotion/core';
import { invoke } from '@forge/bridge';
import '@atlaskit/css-reset';
import Button from '@atlaskit/button/standard-button';
import Select, { ValueType as Value } from '@atlaskit/select';
import ArrowLeftCircleIcon from '@atlaskit/icon/glyph/arrow-left-circle';
import ArrowRightCircleIcon from '@atlaskit/icon/glyph/arrow-right-circle';
import IssueRaiseIcon from '@atlaskit/icon/glyph/issue-raise';
import EditorDoneIcon from '@atlaskit/icon/glyph/editor/done';
import RecentIcon from '@atlaskit/icon/glyph/recent';
import Epic16Icon from '@atlaskit/icon-object/glyph/epic/16';
import Story16Icon from '@atlaskit/icon-object/glyph/story/16';
import Task16Icon from '@atlaskit/icon-object/glyph/task/16';
import Subtask16Icon from '@atlaskit/icon-object/glyph/subtask/16'
import Avatar from '@atlaskit/avatar';
import Tooltip from '@atlaskit/tooltip';
import Spinner from '@atlaskit/spinner';
import { ProgressIndicator } from '@atlaskit/progress-indicator';
import { DatePicker } from '@atlaskit/datetime-picker';
import { parseISO, Interval, differenceInDays, format } from 'date-fns'; 
import closestIndexTo from 'date-fns/closestIndexTo';
import FilterIcon from '@atlaskit/icon/glyph/filter';
import { CheckboxSelect } from '@atlaskit/select';
import Tag, { SimpleTag } from '@atlaskit/tag';
import TagGroup from '@atlaskit/tag-group';
import type {
  OptionProps,
  SingleValueProps,
  ValueType,
} from '@atlaskit/select/types';
import Form, { ErrorMessage, Field, FormFooter, ValidMessage } from '@atlaskit/form';

import mermaid from 'mermaid';
import example from "./example";
import SvgComponent from './SvgMermaid';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Card from 'react-bootstrap/Card';
import CardGroup from 'react-bootstrap/CardGroup';
import 'bootstrap/dist/css/bootstrap.min.css';
import './mermaid.css';
import {ScrollMenu} from 'react-horizontal-scrolling-menu';
import { transform } from '@svgr/core'




const DEFAULT_CONFIG = {
  startOnLoad: true,
//  theme: "default",
//  logLevel: "debug",
//  securityLevel: "antiscript",
//  arrowMarkerAbsolute: false,
//  width: 300,
//  height: 300,
  flowchart: {
    htmlLabels: true,
    curve: "linear",
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
    actorMargin: 50,
    width: 150,
    height: 65,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
    mirrorActors: true,
    bottomMarginAdj: 1,
    useMaxWidth: true,
    rightAngles: false,
    showSequenceNumbers: false,
  },
  gantt: {
    titleTopMargin: 25,
    barHeight: 20,
    barGap: 4,
    topPadding: 50,
    leftPadding: 75,
    gridLineStartPadding: 35,
    fontSize: 11,
    fontFamily: '"Open-Sans", "sans-serif"',
    numberSectionStyles: 4,
    axisFormat: "%Y-%m-%d",
  },
}

const MermaidDiagram = (props) =>{

  const { mermaidAPI } = mermaid;
  console.warn('Here', mermaid);

  const [mermaidCode, setMermaidCode] = useState('');
  const [mermaidSVG, setMermaidSVG] = useState('');
  const [activeCommit, setActiveCommit] = useState('');
  const svgImg = useRef();

  useEffect(()=>{
    console.log("Getting the props");
    var commitIndex = props.activeCommit;
    if(props.activeCommit != undefined){
      console.log("Getting active commit from props");
      setActiveCommit(props.activeCommit);
    }

    if(props.commitsObj.length >0){
      console.log("commits object was initialised!");
      if(props.commitsObj[commitIndex].analysis != undefined){
        console.log("Setting the mermaid code");
        setMermaidCode(props.commitsObj[commitIndex].analysis.mermaid);
      }
    }


  }, [props]);

  useEffect(()=>{

    console.log("Running Mermaid API check");
    if(mermaidCode){
      console.log("Now calling mermaidAPI");
      mermaidAPI.render('the-id', mermaidCode, (g)=>{
        setMermaidSVG(g);

        svgImg.current.innerHTML = g;

        console.log(g);
      });
    }

  }, [mermaidCode]);






  return(
    <div ref={svgImg} style={{width: '100%'}}>
    </div>
  )
}


const ChangesBar = (props) => {

  const add=props.add;
  const del=props.del;
  const total = props.total - add - del;
  const noChange = ((add==0 && del==0)? true: false);

  return(
    <div>
      {(!noChange) && 
        <ProgressBar>
          <ProgressBar variant="success" now={props.add*100} key={1} label={add} />
          <ProgressBar variant="info" now={total*100} key={2} label={"other: " + total }/>
          <ProgressBar variant="danger" now={props.del*100} key={3} label={del} />
        </ProgressBar>
      }
      {noChange && 
        <ProgressBar variant="info" now={total*100} key={2} label={"No changes in this commit" }/>
      }

    </div>
  );
}

const AvatarToolTip = (props) => {

  const url = props.avatarUrl;
  const displayName = props.displayName;

  useEffect(()=>{
    console.log("Rendering avatar");
    console.log(props);
  }, []);

  return(
    <Tooltip content={displayName}>
      <Avatar
        name={displayName}
        src={url}
        size="small"
        label={displayName}
      />
    </Tooltip>
  );

}


/**
 * 
 * @param props Contains the commitsObj and activeCommit
 * @returns A info panel with controls
 */
const ClassInfoCard = (props) => {


  const [commitsObj, setCommitsObj] = useState([]);
  const [activeCommit, setActiveCommit] = useState(0);
  const [classTitle, setClassTitle] = useState('');
  const [commitAnalysis, setCommitAnalysis] = useState(false);
  const [selectButtons, setSelectButtons] = useState('Loading buttons...');
  const [currentAddDel, setCurrentAddDel] = useState('');
  const [changeAvatar, setChangeAvatar] = useState('');
  const [totalsChanges, setTotalsChanges] = useState(0);

  useEffect(()=>{
    console.log(props.commitsObj);
    console.log(props.activeCommit);
    setCommitsObj(props.commitsObj);
    setActiveCommit(props.activeCommit);
    if(props.commitsObj.length>0){
      setCommitAnalysis(props.commitsObj[props.activeCommit].analysis? props.commitsObj[props.activeCommit].analysis: '');
    }
    
    //setClassTitle(props.commitsObj[props.activeCommit])

  }, [props])

  useEffect(()=>{

    if(commitAnalysis){
      const classButtons = commitAnalysis.mapping.map((classes)=>{
        return classes.fileClasses.map((className)=>{
          return(<Button 
          onClick={()=>{setClassTitle(className)}} 
          appearance="subtle">
            {className}
          </Button>);
        });
  
      });
      console.log("This is the Buttons object");
      console.log(classButtons);
      setSelectButtons(classButtons);

      if(commitAnalysis.changes.length >0)
        setTotalsChanges(commitAnalysis.changes[0].totals.total);


    }else{
      console.log("the commitAnalysis effect was triggered,but conditions were not favourable");
      console.log(commitAnalysis);
    }



  }, [commitAnalysis]);


  useEffect(()=>{

    var classFilePath = '';

    if(commitAnalysis){
      commitAnalysis.mapping.forEach((mapClassFile)=>{

        mapClassFile.fileClasses.forEach((fileClass)=>{
          if(fileClass == classTitle){
            classFilePath = mapClassFile.filePath;
          }
        });
  
      });
  
  
      var changesFound = false;
      commitAnalysis.changes.forEach((change)=>{
        if(classFilePath == change.filename){
          setCurrentAddDel({add: change.additions, del: change.deletions});
          setChangeAvatar({name: commitsObj[activeCommit].commiter_name, avatar: change.commitAvatar});
          console.log(changeAvatar);
          console.log("Not changing the avatar");
          console.log(activeCommit);
          changesFound = true;
          
        }
        else{
          setChangeAvatar({name: commitsObj[activeCommit].commiter_name, avatar: change.commitAvatar});
        }
      });

      if(!changesFound){
        setCurrentAddDel({add: 0, del: 0});
      }
    }




  }, [classTitle])

  return(
    <div>
      {selectButtons.length > 0 &&
        selectButtons
      }
      <Card style={{ width: '20rem', minHeight: '5rem', margin: '5px' }}>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{display: 'flex', flexDirection: 'row', alignItems: 'strech', justifyContent: 'center'}}>
            <Card.Title>{classTitle? classTitle:'Loading...'}</Card.Title>
            {changeAvatar &&
                <AvatarToolTip avatarUrl={changeAvatar.avatar} displayName={changeAvatar.name} />
              }
          </div>
          <Card.Body>
            {currentAddDel &&
              <ChangesBar add={currentAddDel.add} del={currentAddDel.del} total={totalsChanges}/>
            }
          </Card.Body>
        </div>
      </Card>

      <p>using state {activeCommit}</p>
    </div>
  )
}

/**
 * props.jiraIssueObj : contains the whole object issue returned from Jira Rest API
 *            id: int
 *            key: string ex. "BC-8"
 *            fields.issuetype.name: string ex. "Task", "Bug", "Epic", "Story"
 *            created: DateISO ex. "2022-04-09T09:20:29.237+0200"
 *            resolution: null/Object{ name: Done }
 *            resolutiondate: DateISO ex. "2022-04-09T09:20:29.237+0200"
 *            summary: string ex. "Task description"
 *            assignee.avatarUrls.16x16: string url
 *            assignee.displayName: string ex. "Johnny Appleseed"
 * 
 * */
const JiraIssue = (props) => {

  console.log(props);
  const issueKey = props.jiraIssueObj.key;
  const issueType = props.jiraIssueObj.issueType;
  const createdDate = (props.jiraIssueObj.created? props.jiraIssueObj.created : '');
  const resolutionIssue = (props.jiraIssueObj.resolution? props.jiraIssueObj.resolution : '');
  const resolutionDate = (props.jiraIssueObj.resolutiondate? props.jiraIssueObj.resolutiondate : 'In progress');
  const issueTitle = (props.jiraIssueObj.summary? props.jiraIssueObj.summary : 'Title not provided');
  const avatarUrl = (props.jiraIssueObj.assigneeAvatar? props.jiraIssueObj.assigneeAvatar : '');  
  const displayName = (props.jiraIssueObj.assigneeName? props.jiraIssueObj.assigneeName : '');

  

  const [hovered, setHovered] = useState(false);
  const issueDuration = (resolutionIssue? (differenceInDays( parseISO(resolutionDate),parseISO(createdDate)  )) : '');
  const issueDurationB = (resolutionIssue? (differenceInDays( parseISO(createdDate),parseISO(resolutionDate)  )) : '');
  console.log(issueDuration);
  console.log(issueDurationB);

  const createdFormatedDate = (createdDate? format(parseISO(createdDate), 'dd. MMM yyyy'): '');
  const resolutionFormatedDate = (resolutionIssue? format(parseISO(resolutionDate), 'dd. MMM yyyy'): '');

  return (
    <div>

      <Card 

      onMouseEnter={()=>{setHovered(true)}} 
      onMouseLeave={()=>{setHovered(false)}}
      style={{ 
        width: (hovered? '20rem': '13em'),
        minHeight: (hovered? '13em': '0em'), 
        margin: '5px', 
        transition: 'height 0.5s ease-in-out',
      }} 
        border={resolutionIssue? 'success': ''}>
        
        {hovered && <Card.Body>
          <Card.Title>{issueTitle}</Card.Title>
          <Tooltip content={'Date created'}>
            <SimpleTag
            text={createdFormatedDate}
            elemBefore={<IssueRaiseIcon label="defined label" size="small" />}
            />
          </Tooltip>
          {resolutionIssue &&
            <Tooltip content={'Date resolved'}>
            <SimpleTag
            text={resolutionFormatedDate}
            elemBefore={<EditorDoneIcon label="defined label" size="small" />}
            />
            </Tooltip>
          }
          
          {resolutionIssue &&
          <Tooltip content={'Days taken to resolve issue'}>
            <SimpleTag
            text={issueDuration + (issueDuration > 1? "days":"day")}
            elemBefore={<RecentIcon label="defined label" size="small" />}
            />
            </Tooltip>
          }
        </Card.Body>}
        <Card.Footer>
          <div style={{display:'flex',justifyContent: 'space-between',alignItems: 'strech'}}>
            <div style={{display: 'flex', alignItems:'baseline'}}>
              {issueType == 'Task' &&
                <Task16Icon label="Task type"/>
              }
              {issueType == 'Epic' &&
                <Epic16Icon label="Task type"/>
              }
              {issueType == 'Story' &&
                <Story16Icon label="Task type"/>
              }
              {issueType == 'Subtask' &&
                <Subtask16Icon label="Task type"/>
              }
              <p style={{marginLeft: '10px', color:'grey', fontWeight: '600'}}>{issueKey}</p>
            </div>
              {
              displayName && 
                <AvatarToolTip 
                avatarUrl={avatarUrl} 
                displayName={displayName}/>
              }
            </div>
            {!hovered && 
              <p>{issueTitle}</p>
            }
        </Card.Footer>
      </Card>
    </div>
  )
}



const Mermaid = ({ name, chart, config }) => {
  
 

  // Mermaid initilize its config
  mermaid.initialize({...DEFAULT_CONFIG, ...config});
  console.log("Mermaid initialised");


  useEffect(() => {

    mermaid.contentLoaded()
    console.log("Content loaded function done");




  }, [config])

  console.log("chart");
  if (!chart) return null
  return (
    <div>
      <div className="mermaid" name={name}>
        {chart}
      </div>
    </div>

  );

  
  
}

interface Option {
  label: string;
  value: string;
}

interface Category {
  colors?: ValueType<Option>;
  icecream?: ValueType<Option[]>;
  suit?: ValueType<Option[]>;
}

const colors = [
  { label: 'Blue', value: 'blue' },
  { label: 'Red', value: 'red' },
  { label: 'Purple', value: 'purple' },
  { label: 'Black', value: 'black' },
  { label: 'White', value: 'white' },
  { label: 'Gray', value: 'gray' },
  { label: 'Yellow', value: 'yellow' },
];


const getReposUserAuth = async() => {

  console.log("Calling invoke function for user repos");

  const response1 = await invoke('getReposUserAuth', {});
  console.log("called!");
  
  console.log("Returning");
  return response1;
}





function App() {
  const [data, setData] = useState(null);
  const [reposUser, setReposUser] = useState(null);
  const [branch, setBranch] = useState(null);
 

  const [repoSelectedName, setRepoSelectedName] = useState(null);
  const [gitOwner, setGitOwner] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [visualisation, setVisualisation] = useState([]);
  const [jiraIssues, setJiraIssues] = useState([]);
  const [commitsObj, setCommitsObj] = useState([]);


  //UI states
  const [reposUI, setReposUI] = useState([]);
  const [branchesUI, setBranchesUI] = useState([]);
  const [filesUI, setFilesUI] = useState([]);
  const [jiraBoards, setJiraBoards] = useState([]);
  const [formState, setFormState] = useState(0);
  const [formMinDate, setFormMinDate] = useState("");
  const [jiraBoard, setJiraBoard] = useState('');
  const [classesAndFilesMapping, setClassesAndFilesMapping] = useState([]);
  const [jiraIssuesUI, setJiraIssuesUI] = useState([]);
  const [jiraIssuesMapp, setJiraIssuesMapp] = useState([]);
  const [jiraLoadingSpinner, setJiraLoadingSpinner] = useState(false);
  const [activeCommit, setActiveCommit] = useState(0);
  const [analysisLoading, setAnalysisLoading] = useState(false);



  const chooseBranch = async (formData) => {
    const selectedRepo = formData.repo;
    setRepoSelectedName(selectedRepo);

    invoke('getBranchesForRepo', {repoName: selectedRepo, owner: gitOwner}).then((branchesLog)=>{
      console.log(branchesLog);
      var branchesUIArr = [];

      branchesLog.forEach(branch => {
        branchesUIArr.push({label: branch.name, value:branch});
      });
      setBranchesUI(branchesUIArr);
    });

    setFormState(1);
  }

  const chooseFiles = async (formData) => {

    setFormState(2);
    setBranch(formData.branch.sha);
    console.log("Choose files form data");
    console.log(formData);

    invoke('getFilesFromBranch', {sha: formData.branch.value.sha, gitOwner: gitOwner, repoSelected: repoSelectedName.value}).then((filesLog)=>{
      console.log(filesLog); //[{path:string, sha: string}]
      var filesUIArr = [];

      filesLog.forEach(file => {
        filesUIArr.push({
          value: file,
          label: file.path,
        })
      });

      setFilesUI(filesUIArr);

    });


  }

  const calculateCommitConnection = (issueDate) => {

    if (issueDate == null){
      return '';
    }
    const issueDateObj = parseISO(issueDate);



    var commitDates = [];

    if(commitsObj.length> 0){
      commitsObj.forEach((commit)=>{
        commitDates.push(parseISO(commit.date));
      });
    }


    var indexClosest = closestIndexTo(issueDateObj, commitDates);



    return indexClosest;



  }

  const setJiraBoardForm = async (formData) => {
    setJiraLoadingSpinner(true);
    var jiraIssuesApiRes = [];
    setJiraBoard(formData.project);
    invoke('getJiraIssues', {projectKey: formData.project}).then((issuesResponse)=>{

      console.log(issuesResponse);

      issuesResponse.issues.forEach((issue)=>{
        jiraIssuesApiRes.push({
          id: issue.id,
          key: issue.key,
          issueType: issue.fields.issuetype.name,
          created: issue.fields.created,
          resolution: issue.fields.resolution,
          resolutiondate: issue.fields.resolutiondate,
          summary: issue.fields.summary,
          assigneeAvatar: (issue.fields.assignee? issue.fields.assignee.avatarUrls['16x16'] : ''),
          assigneeName: (issue.fields.assignee? issue.fields.assignee.displayName : ''),
          commitConection: (commitsObj.length == 0 ? '' : calculateCommitConnection(issue.fields.resolutiondate,)),
        });
      });
      
      console.log(jiraIssuesApiRes);
      setJiraIssues(jiraIssuesApiRes);
  
      const mapJiraIssues = jiraIssuesApiRes.map((issue)=>{
        console.log(issue);
        return <JiraIssue key={issue.key} jiraIssueObj={issue} itemId={issue.key}/>;
        }    
      );
      console.log(jiraIssues[0]);
      setJiraIssuesUI(jiraIssuesApiRes[0]);
      setJiraIssuesMapp(mapJiraIssues);
      setJiraLoadingSpinner(false);

    });



  }

  const chooseDates = async (formData) => {
    console.log('Files form data returned');
    console.log(formData);

    setSelectedFiles(formData);

    setFormState(3);
  }

  const storeConfigData = async (formData)=>{

    console.log(formData);

    console.log(selectedFiles);
    invoke('processFormGetFiles', {owner: gitOwner, repo: repoSelectedName.value, files: selectedFiles, branch_sha: branch}).then((res) =>{
      
      setCommitsObj(res);
      
      console.log(res);
    });



  }

  const setMinDate = (value) =>{
    setFormMinDate(value);
  }


  useEffect(() => {
    invoke('getText', { example: 'my-invoke-variable' }).then(setData);
    invoke('getGitOwner', {}).then(setGitOwner);
    invoke('getReposUserAuth', {}).then((res) => {setReposUser(res)});
    console
    invoke('getJiraBoards', {}).then((res)=> {
      var jiraResBoards = [];
      res.values.forEach((board)=>{
        jiraResBoards.push({
          label: board.key + " " + board.name,
          value: board.key
        });
      });
      setJiraBoards(jiraResBoards);
    })
    //setReposUser(async () => {return await getReposUserAuth()});
    console.log(reposUser);
    
  }, []);


  const validateField = (value?:string)=>{
    if(!value){
      return 'REQUIRED';
    }
  }

  useEffect (()=>{
    

    if (reposUser !== null){
      var selectReposOptions = [];
      reposUser.forEach(repo => {
        selectReposOptions.push({label: repo, value: repo});
      });
      console.log(selectReposOptions);
      setReposUI(selectReposOptions);
      
    }

  }, [reposUser])

  /** 
  useEffect(()=>{
    console.log(jiraIssues);
    
    const mapJiraIssues = jiraIssues.map((issue)=>{
      console.log(issue);
      return <JiraIssue key={issue.key} jiraIssueObj={issue}/>;
      }    
    );
    console.log(jiraIssues[0]);
    setJiraIssuesUI(jiraIssues[0]);
    console.log(jiraIssuesUI);
    console.log(mapJiraIssues);


  }, [jiraIssues])
*/

  useEffect(()=>{

    setAnalysisLoading(true);
    if(commitsObj != undefined && commitsObj[activeCommit] != undefined){
      if(commitsObj[activeCommit].mapping == undefined){
        if(commitsObj[activeCommit].changes == undefined){
          invoke('analyseCommit', {commitInfo: commitsObj[activeCommit]}).then((res)=>{
            var commitsObjUpgrade = [...commitsObj];
            commitsObjUpgrade[activeCommit].analysis = res;
            setCommitsObj(commitsObjUpgrade);
            console.log(commitsObjUpgrade);
            setAnalysisLoading(false);
          })
        }
      }
    }
  
    if(jiraIssues.length > 0){
      const filteredJiraIssues = jiraIssues.filter((issue)=>{
        if(issue.commitConection !== '' && issue.commitConection >= activeCommit){
          return true;
        }else{
          return false;
        }
      });

      filteredJiraIssues.sort((a,b)=>{
        return new Date(b.resolutiondate) - new Date(a.resolutiondate);
      });

      console.log(filteredJiraIssues);

      const mapJiraIssues = filteredJiraIssues.map((issue)=>{
        console.log(issue);
        if(issue.commitConection !== '' && issue.commitConection >= activeCommit){
          return <JiraIssue key={issue.key} jiraIssueObj={issue} itemId={issue.key}/>;
        }else{
          return;
        }

        }    
      );

      setJiraIssuesMapp(mapJiraIssues);
    }

    


  }, [activeCommit])



  return (
    <div>
        {data ? data : 'Loading...'}
        {reposUser ? 'Loaded' : 'Loading...ReposUser' }

        {formState == 0 && (<Form<Category>
          onSubmit={(data)=>{
          chooseBranch(data);
          }}  
          >
            {({ formProps }) =>(
              <form {...formProps}>
                <Field<ValueType<Option>> name='repo' label='Select repository'>
                  {({ fieldProps: { id, ...rest }, error}) =>(
                    <Fragment>
                      <Select<Option>
                        inputId={id}
                        options={reposUI.length ? reposUI : []}
                        {...rest}
                        isClearable
                        />
                    </Fragment>
                  )}
                </Field>
                <FormFooter>
                <Button type="submit" appearance="primary">
                  Submit
                </Button>
              </FormFooter>
              </form>
            )}
          </Form> )}
          {formState == 1 && (<Form<Category>
          onSubmit={(data)=>{
          chooseFiles(data);
          }}  
          >
            {({ formProps }) =>(
              <form {...formProps}>
                <Field<ValueType<Option>> name='branch' label='Select repo branch'>
                  {({ fieldProps: { id, ...rest }, error}) =>(
                    <Fragment>
                      <Select<Option>
                        inputId={id}
                        options={branchesUI.length ? branchesUI : []}
                        {...rest}
                        isClearable
                        />
                    </Fragment>
                  )}
                </Field>
                <FormFooter>
                <Button 
                iconBefore={<ArrowLeftCircleIcon label="Arrow back" size="small"/>}
                onClick={()=>{setFormState(0)}} 
                appearance="subtle">
                  Back: Select branch
                </Button>
                <Button type="submit" appearance="primary">
                  Submit
                </Button>
              </FormFooter>
              </form>
            )}
          </Form> )}
          {formState == 2 && (<Form<Category>
          onSubmit={(data)=>{
          chooseDates(data);
          }}  
          >
            {({ formProps }) =>(
              <form {...formProps}>
                <Field<ValueType<Option>> name='file' label='Select up-to 10 files'>
                  {({ fieldProps: { id, ...rest }, error}) =>(
                    <Fragment>
                      <Select<Option>
                        inputId={id}
                        options={filesUI.length ? filesUI : []}
                        {...rest}
                        isClearable
                        isMulti
                        />
                    </Fragment>
                  )}
                </Field>
                <FormFooter>
                <Button 
                iconBefore={<ArrowLeftCircleIcon label="Arrow back" size="small"/>}
                onClick={()=>{setFormState(1)}} 
                appearance="subtle">
                  Back: Select branch
                </Button>
                <Button type="submit" appearance="primary">
                  Submit
                </Button>
  
              </FormFooter>
              </form>
            )}
          </Form> )}
          {formState == 3 && (<Form<Category>
          onSubmit={(data)=>{
          storeConfigData(data);
          }}  
          >
            {({ formProps }) =>(
              <form {...formProps}>
              <Field
                name="datetime-picker-from"
                label="From date"
                validate={validateField}
                isRequired
                defaultValue=""
              >
                {({ fieldProps, error, meta: { valid } }) => (
                <>
                  <DatePicker {...fieldProps} dateFormat="YYYY-MM-DDTHH:MM:SSZ" parseInputValue={(date: string)=>parseISO(date)} />
                  {valid && (
                    <ValidMessage>You have entered a valid date</ValidMessage>
                  )}
                  {error === 'REQUIRED' && (
                    <ErrorMessage>This field is required</ErrorMessage>
                  )}
                </>
                )}
                </Field>
                <Field
                name="datetime-picker-to"
                label="To date"
                validate={validateField}
                isRequired
                defaultValue=""
              >
                {({ fieldProps, error, meta: { valid } }) => (
                <>
                <DatePicker {...fieldProps} dateFormat="YYYY-MM-DDTHH:MM:SSZ"/>
                {valid && (
                  <ValidMessage>You have entered a valid date</ValidMessage>
                )}
                {error === 'REQUIRED' && (
                  <ErrorMessage>This field is required</ErrorMessage>
                )}
                </>
                )}
                </Field>
                <FormFooter>
                <Button 
                iconBefore={<ArrowLeftCircleIcon label="Arrow back" size="small"/>}
                onClick={()=>{setFormState(2)}} 
                appearance="subtle">
                  Back: Select branch
                </Button>
                <Button type="submit" appearance="primary">
                  Submit
                </Button>
  
              </FormFooter>
              </form>
            )}
          </Form> )}

          {jiraBoard == '' && (<Form<Category>
          onSubmit={(data)=>{
          setJiraBoardForm(data);
          }}  
          >
            {({ formProps }) =>(
              <form {...formProps}>
                <Field<ValueType<Option>> name='project' label='Select Jira Project'>
                  {({ fieldProps: { id, ...rest }, error}) =>(
                    <Fragment>
                      <Select<Option>
                        inputId={id}
                        options={jiraBoards.length ? jiraBoards : []}
                        {...rest}
                        isClearable
                        />
                    </Fragment>
                  )}
                </Field>
                <FormFooter>
                <Button 
                iconBefore={<ArrowLeftCircleIcon label="Arrow back" size="small"/>}
                onClick={()=>{setFormState(1)}} 
                appearance="subtle">
                  Use without Jira project
                </Button>
                <Button type="submit" appearance="primary">
                  Submit
                </Button>
  
              </FormFooter>
              </form>
            )}
          </Form> )}


        <div style={{display:'flex'}}>
            
            <MermaidDiagram activeCommit={activeCommit} commitsObj={commitsObj}/>
            <ClassInfoCard commitsObj={commitsObj} activeCommit={activeCommit}/>

        </div>  
        <div>{commitsObj.length>0 && <ProgressIndicator selectedIndex={activeCommit} values={commitsObj} />}</div>
        <div>
            {(activeCommit!=0) &&
              <Button 
                iconBefore={<ArrowLeftCircleIcon label="Arrow back" size="small"/>}
                onClick={()=>{setActiveCommit(activeCommit-1)}} 
                appearance="subtle"
                >
                  -1 active commit
                
              </Button>
            }
          {(commitsObj.length != (activeCommit+1))&& 
            <Button 
                iconBefore={<ArrowRightCircleIcon label="Arrow back" size="small"/>}
                onClick={()=>{setActiveCommit(activeCommit+1)}} 
                appearance="subtle"
                >
                  +1 active commit
                
            </Button>
          } 

            {analysisLoading &&
              <Spinner size={'small'}/>
            }
        </div>

             


        <div style={{height: '20em'}}>
          {jiraLoadingSpinner &&
            <div style={{display: 'flex', justifyContent: 'center'}}>
            <Spinner size={'xlarge'}/>
            </div>
            
          }
          <ScrollMenu
            options={{
              ratio: 0.9,
              rootMargin: "5px",
              threshold: [0.01, 0.05, 0.5, 0.75, 0.95, 1]
            }}
          >
            {jiraIssuesMapp.length>0? jiraIssuesMapp: <div>No issues to show</div>}
          </ScrollMenu>
        </div>

          

      

        <Button>Hellllo World!</Button>
        {/* <Mermaid chart={example} name="classDiagram-v2" />
        

        <Mermaid2 />
        */}

      
    </div>
  );
}

export default App;
