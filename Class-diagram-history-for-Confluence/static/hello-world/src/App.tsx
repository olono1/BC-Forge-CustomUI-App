import React, { Fragment, useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';
import '@atlaskit/css-reset';
import Button from '@atlaskit/button/standard-button';
import Select, { ValueType as Value } from '@atlaskit/select';
import type {
  OptionProps,
  SingleValueProps,
  ValueType,
} from '@atlaskit/select/types';
import Form, { ErrorMessage, Field, FormFooter } from '@atlaskit/form';

import mermaid from 'mermaid';
import example from "./example";
import SvgComponent from './SvgMermaid';



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



function App() {
  const [data, setData] = useState(null);
  const [reposUser, setReposUser] = useState([]);

  useEffect(() => {
    invoke('getText', { example: 'my-invoke-variable' }).then(setData);
    invoke('getReposUserAuth', {}).then((res) => {console.log(res); setReposUser(res)});
    
    console.log(reposUser);
  }, []);

  useEffect (()=>{
    console.log(reposUser);
  }, [reposUser])

  return (
    <div>
      {data ? data : 'Loading...'}



      <Form<Category>
        onSubmit={(data)=>{
          console.log('form data', data);
        }}  
        >
          {({ formProps }) =>(
            <form {...formProps}>
              <Field<ValueType<Option>> name='colors' label='Select a color'>
                {({ fieldProps: { id, ...rest }, error}) =>(
                  <Fragment>
                    <Select<Option>
                      inputId={id}
                      options={colors}
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
        </Form>

    

      <Button>Hellllo World!</Button>
      <Mermaid chart={example} name="classDiagram-v2" />
      <SvgComponent />

      <Mermaid2 />

    </div>
  );
}

export default App;
