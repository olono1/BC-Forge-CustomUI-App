import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';
import {Tag, Grommet} from 'grommet';
import Button from '@atlaskit/button';
import mermaid from 'mermaid';
import example from "./example";

const DEFAULT_CONFIG = {
  startOnLoad: true,
  theme: "forest",
  logLevel: "fatal",
  securityLevel: "strict",
  arrowMarkerAbsolute: false,
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
    <div className="mermaid" name={name}>
      {chart}
    </div>
  )

  
  
}



function App() {
  const [data, setData] = useState(null);
  const [reposUser, setReposUser] = useState([]);

  useEffect(() => {
    invoke('getText', { example: 'my-invoke-variable' }).then(setData);
    invoke('getReposUserAuth', {}).then((res) => setReposUser(res));
    console.log(reposUser);
  }, []);

  return (
    <div>
      {data ? data : 'Loading...'}

      <Button>Hellllo World!</Button>
      <Mermaid chart={example} />

    </div>
  );
}

export default App;
