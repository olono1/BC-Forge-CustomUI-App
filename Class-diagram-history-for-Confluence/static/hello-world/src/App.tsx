import React, { Fragment, useEffect, useState } from 'react';
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
import {ScrollMenu} from 'react-horizontal-scrolling-menu';




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

const Mermaid2 = () =>{

  const { mermaidAPI } = mermaid;
  console.warn('Here', mermaid);

  var graph;

  mermaidAPI.render('the-id', `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
      +String beakColor
      +swim()
      +quack()
    }
    class Fish{
      -int sizeInFeet
      -canEat()
    }
    class Zebra{
      +bool is_wild
      +run()
    }
            
        `, g => {

          graph=g;

  });

  return(
    <div>
      {graph}
    </div>
  )
}


const ChangesBar = (props) => {

  return(
    <div>
      <ProgressBar>
        <ProgressBar variant="success" now={props.add*100} key={1} />
        <ProgressBar variant="danger" now={props.del*100} key={2} />
      </ProgressBar>
    </div>
  );
}

const AvatarToolTip = (props) => {

  const url = props.avatarUrl;
  const displayName = props.displayName;

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
 * @param props Contains the CommitsObj and activeCommit
 * @returns A info panel with controls
 */
const ClassInfoCard = (props) => {


  const [commitsObj, setCommitsObj] = useState([]);
  const [activeCommit, setActiveCommit] = useState(0);

  useEffect(()=>{
    setCommitsObj(props.commitsObj);
    setActiveCommit(props.activeCommit);

  }, [props])

  return(
    <div>

      <Card style={{ width: '20rem', minHeight: '13rem', margin: '5px' }}>
        
        <Card.Header>{props.activeCommit}</Card.Header>
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

  const issueDuration = (resolutionIssue? (differenceInDays( parseISO(resolutionDate),parseISO(createdDate)  )) : '');
  const issueDurationB = (resolutionIssue? (differenceInDays( parseISO(createdDate),parseISO(resolutionDate)  )) : '');
  console.log(issueDuration);
  console.log(issueDurationB);

  const createdFormatedDate = (createdDate? format(parseISO(createdDate), 'dd. MMM yyyy'): '');
  const resolutionFormatedDate = (resolutionIssue? format(parseISO(resolutionDate), 'dd. MMM yyyy'): '');

  return (
    <div>

      <Card style={{ width: '20rem', minHeight: '13rem', margin: '5px' }} border={resolutionIssue? 'success': ''}>
        <Card.Body>
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
        </Card.Body>
        <Card.Footer style={{display:'flex',justifyContent: 'space-between',alignItems: 'strech'}}>
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
          assigneeName: (issue.fields.assignee? issue.fields.assignee.displayName : '')
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

    if(commitsObj != undefined && commitsObj[activeCommit] != undefined){
      if(commitsObj[activeCommit].mapping == undefined){
        if(commitsObj[activeCommit].changes == undefined){
          invoke('analyseCommit', {commitInfo: commitsObj[activeCommit]}).then((res)=>{
            console.log(res);
          })
        }
      }
    }

  }, [activeCommit])



  return (
    <div>
      {data ? data : 'Loading...'}
      {reposUser ? 'Loaded' : 'Loading...ReposUser' }
      <ChangesBar add='20' del='10'/>

      
      {commitsObj.length>0 && <ProgressIndicator selectedIndex={activeCommit} values={commitsObj} />}


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


      <div>

          <ClassInfoCard commitsObj={commitsObj} activeCommit={activeCommit}/>
          <Button 
              iconBefore={<ArrowLeftCircleIcon label="Arrow back" size="small"/>}
              onClick={()=>{setActiveCommit(activeCommit+1)}} 
              appearance="subtle">
                +1 active commit
          </Button>
      </div>           


      <div>
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
          {jiraIssuesMapp? jiraIssuesMapp: <div>Loading Issues...</div>}
        </ScrollMenu>
      </div>

        

    

      <Button>Hellllo World!</Button>
      <Mermaid chart={example} name="classDiagram-v2" />
      <SvgComponent />

      <Mermaid2 />

    </div>
  );
}

export default App;
