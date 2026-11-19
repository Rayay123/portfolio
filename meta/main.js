import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import scrollama from "https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm";

async function loadData(){
  // turn the csv strings into numbers and dates
  return d3.csv("loc.csv",row=>({
    ...row,
    line:Number(row.line),
    depth:Number(row.depth),
    length:Number(row.length),
    date:new Date(row.date+"T00:00"+row.timezone),
    datetime:new Date(row.datetime),
  }));
}

function processCommits(data){
  // group every changed line under its commit
  return d3.groups(data,d=>d.commit).map(([commit,lines])=>{
    let first=lines[0];
    let {author,date,time,timezone,datetime}=first;

    let result={
      id:commit,
      url:`https://github.com/Rayay123/portfolio/commit/${commit}`,
      author,
      date,
      time,
      timezone,
      datetime,
      hourFrac:datetime.getHours()+datetime.getMinutes()/60,
      totalLines:lines.length,
    };

    Object.defineProperty(result,"lines",{
      value:lines,
      enumerable:false,
      writable:false,
      configurable:false,
    });

    return result;
  }).sort((a,b)=>a.datetime-b.datetime);
}

function renderCommitInfo(commits){
  let lines=commits.flatMap(d=>d.lines);
  let stats=d3.select("#stats");
  stats.html("");

  let fileLengths=d3.rollups(
    lines,
    values=>d3.max(values,d=>d.line),
    d=>d.file,
  );

  let workByPeriod=d3.rollups(
    lines,
    values=>values.length,
    d=>d.datetime.toLocaleString("en",{dayPeriod:"short"}),
  );

  let values=[
    ["Lines of code",lines.length],
    ["Number of commits",commits.length],
    ["Number of files",d3.group(lines,d=>d.file).size],
    ["Average file length",Math.round(d3.mean(fileLengths,d=>d[1]))+" lines"],
    ["Longest line",d3.max(lines,d=>d.length)+" characters"],
    ["Most common time",d3.greatest(workByPeriod,d=>d[1])?.[0] || "N/A"],
  ];

  let list=stats.append("dl").attr("class","stats");
  for(let [label,value] of values){
    list.append("dt").text(label);
    list.append("dd").text(value);
  }
}

function renderTooltipContent(commit){
  if(!commit) return;

  let link=document.getElementById("commit-link");
  link.href=commit.url;
  link.textContent=commit.id.slice(0,7);

  document.getElementById("commit-date").textContent=commit.datetime.toLocaleDateString("en",{
    dateStyle:"full",
  });
  document.getElementById("tooltip-time").textContent=commit.datetime.toLocaleTimeString("en",{
    timeStyle:"short",
  });
  document.getElementById("commit-author").textContent=commit.author;
  document.getElementById("commit-lines").textContent=commit.totalLines;
}

function updateTooltipVisibility(isVisible){
  document.getElementById("commit-tooltip").hidden=!isVisible;
}

function updateTooltipPosition(event){
  let tooltip=document.getElementById("commit-tooltip");
  let left=Math.min(event.clientX+14,window.innerWidth-260);
  let top=Math.min(event.clientY+14,window.innerHeight-180);

  tooltip.style.left=`${Math.max(8,left)}px`;
  tooltip.style.top=`${Math.max(8,top)}px`;
}

let chartWidth=1000;
let chartHeight=600;
let chartMargin={top:20,right:20,bottom:55,left:65};
let chartArea={
  top:chartMargin.top,
  right:chartWidth-chartMargin.right,
  bottom:chartHeight-chartMargin.bottom,
  left:chartMargin.left,
  width:chartWidth-chartMargin.left-chartMargin.right,
  height:chartHeight-chartMargin.top-chartMargin.bottom,
};

let xScale=d3.scaleTime().range([chartArea.left,chartArea.right]);
let yScale=d3.scaleLinear().domain([0,24]).range([chartArea.bottom,chartArea.top]);
let rScale;
let svg;
let dots;
let brush;
let visibleCommits=[];
let clickedCommitId=null;

function renderScatterPlot(commits){
  let [minLines,maxLines]=d3.extent(commits,d=>d.totalLines);
  rScale=d3.scaleSqrt().domain([minLines,maxLines]).range([4,28]);

  svg=d3
    .select("#chart")
    .append("svg")
    .attr("viewBox",`0 0 ${chartWidth} ${chartHeight}`)
    .attr("role","group")
    .attr("aria-label","Commits plotted by date and time of day. Larger dots edited more lines.");

  svg
    .append("g")
    .attr("class","gridlines")
    .attr("transform",`translate(${chartArea.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat("").tickSize(-chartArea.width));

  svg
    .append("g")
    .attr("class","x-axis")
    .attr("transform",`translate(0,${chartArea.bottom})`);

  svg
    .append("g")
    .attr("class","y-axis")
    .attr("transform",`translate(${chartArea.left},0)`)
    .call(
      d3.axisLeft(yScale)
        .tickValues([0,4,8,12,16,20,24])
        .tickFormat(d=>String(d%24).padStart(2,"0")+":00"),
    );

  dots=svg.append("g").attr("class","dots");

  brush=d3
    .brush()
    .extent([
      [chartArea.left,chartArea.top],
      [chartArea.right,chartArea.bottom],
    ])
    .on("start brush end",brushed);

  svg.call(brush);
  updateScatterPlot(commits);
}

function safeTimeExtent(commits){
  let [start,end]=d3.extent(commits,d=>d.datetime);
  if(+start===+end){
    let halfDay=12*60*60*1000;
    return [new Date(+start-halfDay),new Date(+end+halfDay)];
  }
  return [start,end];
}

function addCircleEvents(circles){
  circles
    .attr("role","button")
    .attr("tabindex",0)
    .attr("aria-label",d=>`${d.totalLines} line${d.totalLines===1 ? "" : "s"} edited on ${d.date} at ${d.time}. Click to select.`)
    .on("mouseenter",function(event,commit){
      d3.select(this).style("fill-opacity",1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mousemove",updateTooltipPosition)
    .on("mouseleave",function(){
      d3.select(this).style("fill-opacity",0.7);
      updateTooltipVisibility(false);
    })
    .on("focus",function(event,commit){
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      let box=this.getBoundingClientRect();
      updateTooltipPosition({clientX:box.right,clientY:box.top});
    })
    .on("blur",()=>updateTooltipVisibility(false))
    .on("click",function(event,commit){
      event.stopPropagation();
      let sameCommit=clickedCommitId===commit.id;

      svg.call(brush.move,null);
      clickedCommitId=sameCommit ? null : commit.id;
      showSelection(sameCommit ? [] : [commit]);
    })
    .on("keydown",function(event){
      if(event.key==="Enter" || event.key===" "){
        event.preventDefault();
        this.dispatchEvent(new MouseEvent("click",{bubbles:true}));
      }
    });
}

function updateScatterPlot(commits){
  visibleCommits=commits;
  xScale.domain(safeTimeExtent(commits)).nice();

  svg
    .select("g.x-axis")
    .transition()
    .duration(220)
    .call(d3.axisBottom(xScale).ticks(6));

  let sortedCommits=d3.sort(commits,d=>-d.totalLines);
  let circles=dots
    .selectAll("circle")
    .data(sortedCommits,d=>d.id)
    .join("circle")
    .attr("cx",d=>xScale(d.datetime))
    .attr("cy",d=>yScale(d.hourFrac))
    .attr("r",d=>rScale(d.totalLines));

  addCircleEvents(circles);
  clickedCommitId=null;
  svg.call(brush.move,null);
  showSelection([]);
  svg.selectAll(".dots, .overlay ~ *").raise();
}

function isCommitSelected(selection,commit){
  if(!selection) return false;

  let [[x0,y0],[x1,y1]]=selection;
  let x=xScale(commit.datetime);
  let y=yScale(commit.hourFrac);
  return x0<=x && x<=x1 && y0<=y && y<=y1;
}

function getSelectedCommits(selection){
  return selection ? visibleCommits.filter(d=>isCommitSelected(selection,d)) : [];
}

function renderSelectionCount(selected){
  let count=selected.length;
  document.getElementById("selection-count").textContent=
    count ? `${count} commit${count===1 ? "" : "s"} selected` : "No commits selected";
}

function renderLanguageBreakdown(selected){
  let container=document.getElementById("language-breakdown");
  container.innerHTML="";
  if(selected.length===0) return;

  let lines=selected.flatMap(d=>d.lines);
  let breakdown=d3.rollup(lines,group=>group.length,d=>d.type);

  for(let [language,count] of breakdown){
    let formatted=d3.format(".1~%")(count/lines.length);
    container.innerHTML+=`<dt>${language}</dt><dd>${count} lines (${formatted})</dd>`;
  }
}

function showSelection(selected){
  let selectedIds=new Set(selected.map(d=>d.id));
  dots.selectAll("circle").classed("selected",d=>selectedIds.has(d.id));
  renderSelectionCount(selected);
  renderLanguageBreakdown(selected);
}

function brushed(event){
  clickedCommitId=null;
  showSelection(getSelectedCommits(event.selection));
}

let fileColors=d3.scaleOrdinal(d3.schemeTableau10);

function updateFileDisplay(commits){
  let lines=commits.flatMap(d=>d.lines);
  let files=d3
    .groups(lines,d=>d.file)
    .map(([name,fileLines])=>({name,lines:fileLines}))
    .sort((a,b)=>b.lines.length-a.lines.length);

  let filesContainer=d3
    .select("#files")
    .selectAll("div.file-row")
    .data(files,d=>d.name)
    .join(
      enter=>enter.append("div").attr("class","file-row").call(row=>{
        let title=row.append("dt");
        title.append("code");
        title.append("small");
        row.append("dd");
      }),
      update=>update,
      exit=>exit.remove(),
    );

  filesContainer.select("dt > code").text(d=>d.name);
  filesContainer.select("dt > small").text(d=>`${d.lines.length} lines`);

  filesContainer
    .select("dd")
    .attr("aria-label",d=>`${d.name}, ${d.lines.length} lines`)
    .selectAll("div.loc")
    .data(d=>d.lines,line=>`${line.commit}-${line.file}-${line.line}`)
    .join("div")
    .attr("class","loc")
    .style("--color",d=>fileColors(d.type))
    .attr("aria-hidden","true")
    .attr("title",d=>`${d.type} line`);

  let types=d3.rollups(lines,values=>values.length,d=>d.type)
    .sort((a,b)=>b[1]-a[1]);

  d3.select("#file-key")
    .selectAll("li")
    .data(types,d=>d[0])
    .join("li")
    .style("--color",d=>fileColors(d[0]))
    .html(d=>`<span class="file-swatch"></span>${d[0]}`);
}

function buildStory(commits){
  d3.select("#scatter-story")
    .selectAll(".step")
    .data(commits,d=>d.id)
    .join("div")
    .attr("class","step")
    .attr("data-commit",d=>d.id)
    .html((d,i)=>{
      let fileCount=d3.group(d.lines,line=>line.file).size;
      let date=d.datetime.toLocaleString("en",{dateStyle:"long",timeStyle:"short"});
      let intro=i===0 ? "This was my first portfolio commit." : "I made another update to the portfolio.";

      return `<p><strong>${date}</strong><br>${intro} The <a href="${d.url}" target="_blank" rel="noreferrer">commit</a> changed ${d.totalLines} line${d.totalLines===1 ? "" : "s"} across ${fileCount} file${fileCount===1 ? "" : "s"}.</p>`;
    });
}

function markStoryStep(commitId){
  d3.selectAll("#scatter-story .step")
    .classed("is-active",d=>d.id===commitId);
}

let data=await loadData();
let commits=processCommits(data);
let filteredCommits=commits;
let commitProgress=100;
let timeScale=d3
  .scaleTime()
  .domain(d3.extent(commits,d=>d.datetime))
  .range([0,100]);
let commitMaxTime=timeScale.invert(commitProgress);

renderScatterPlot(commits);
buildStory(commits);

function updatePage(){
  filteredCommits=commits.filter(d=>d.datetime<=commitMaxTime);
  let lastCommit=filteredCommits.at(-1);

  document.getElementById("commit-time").textContent=commitMaxTime.toLocaleString("en",{
    dateStyle:"long",
    timeStyle:"short",
  });

  renderCommitInfo(filteredCommits);
  updateScatterPlot(filteredCommits);
  updateFileDisplay(filteredCommits);
  if(lastCommit) markStoryStep(lastCommit.id);
}

function onTimeSliderChange(){
  commitProgress=Number(document.getElementById("commit-progress").value);
  commitMaxTime=timeScale.invert(commitProgress);
  updatePage();
}

document.getElementById("commit-progress").addEventListener("input",onTimeSliderChange);
onTimeSliderChange();

function onStepEnter(response){
  let commit=response.element.__data__;
  commitProgress=timeScale(commit.datetime);
  commitMaxTime=commit.datetime;
  document.getElementById("commit-progress").value=commitProgress;
  updatePage();
  markStoryStep(commit.id);
}

const scroller=scrollama();
scroller
  .setup({
    container:"#scrolly-1",
    step:"#scrolly-1 .step",
    offset:0.55,
  })
  .onStepEnter(onStepEnter);

window.addEventListener("resize",()=>scroller.resize());
