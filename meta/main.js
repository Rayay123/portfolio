import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

async function loadData(){
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
  });
}

function renderCommitInfo(data,commits){
  let stats=d3.select("#stats");
  stats.html("");

  let fileLengths=d3.rollups(
    data,
    values=>d3.max(values,d=>d.line),
    d=>d.file,
  );

  let workByPeriod=d3.rollups(
    data,
    values=>values.length,
    d=>d.datetime.toLocaleString("en",{dayPeriod:"short"}),
  );

  let values=[
    ["Total LOC",data.length],
    ["Commits",commits.length],
    ["Files",d3.group(data,d=>d.file).size],
    ["Average file length",Math.round(d3.mean(fileLengths,d=>d[1]))+" lines"],
    ["Longest line",d3.max(data,d=>d.length)+" characters"],
    ["Most active time",d3.greatest(workByPeriod,d=>d[1])?.[0] || "N/A"],
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
  document.getElementById("commit-time").textContent=commit.datetime.toLocaleTimeString("en",{
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

function renderScatterPlot(commits){
  let width=1000;
  let height=600;
  let margin={top:20,right:20,bottom:55,left:65};
  let usableArea={
    top:margin.top,
    right:width-margin.right,
    bottom:height-margin.bottom,
    left:margin.left,
    width:width-margin.left-margin.right,
    height:height-margin.top-margin.bottom,
  };

  let xScale=d3
    .scaleTime()
    .domain(d3.extent(commits,d=>d.datetime))
    .range([usableArea.left,usableArea.right])
    .nice();

  let yScale=d3
    .scaleLinear()
    .domain([0,24])
    .range([usableArea.bottom,usableArea.top]);

  let [minLines,maxLines]=d3.extent(commits,d=>d.totalLines);
  let rScale=d3.scaleSqrt().domain([minLines,maxLines]).range([4,28]);

  let svg=d3
    .select("#chart")
    .append("svg")
    .attr("viewBox",`0 0 ${width} ${height}`)
    .attr("role","group")
    .attr("aria-label","Commits plotted by date and time of day. Larger dots edited more lines.");

  svg
    .append("g")
    .attr("class","gridlines")
    .attr("transform",`translate(${usableArea.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width));

  svg
    .append("g")
    .attr("class","x-axis")
    .attr("transform",`translate(0,${usableArea.bottom})`)
    .call(d3.axisBottom(xScale).ticks(6));

  svg
    .append("g")
    .attr("class","y-axis")
    .attr("transform",`translate(${usableArea.left},0)`)
    .call(
      d3.axisLeft(yScale)
        .tickValues([0,4,8,12,16,20,24])
        .tickFormat(d=>String(d%24).padStart(2,"0")+":00"),
    );

  let sortedCommits=d3.sort(commits,d=>-d.totalLines);
  let dots=svg.append("g").attr("class","dots");

  dots
    .selectAll("circle")
    .data(sortedCommits)
    .join("circle")
    .attr("cx",d=>xScale(d.datetime))
    .attr("cy",d=>yScale(d.hourFrac))
    .attr("r",d=>rScale(d.totalLines))
    .attr("tabindex",0)
    .attr("aria-label",d=>`${d.totalLines} lines edited on ${d.date} at ${d.time}`)
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
    .on("blur",()=>updateTooltipVisibility(false));

  let brushSelection=null;

  function isCommitSelected(selection,commit){
    if(!selection) return false;

    let [[x0,y0],[x1,y1]]=selection;
    let x=xScale(commit.datetime);
    let y=yScale(commit.hourFrac);
    return x0<=x && x<=x1 && y0<=y && y<=y1;
  }

  function getSelectedCommits(selection){
    return selection ? commits.filter(d=>isCommitSelected(selection,d)) : [];
  }

  function renderSelectionCount(selection){
    let count=getSelectedCommits(selection).length;
    document.getElementById("selection-count").textContent=
      count ? `${count} commit${count===1 ? "" : "s"} selected` : "No commits selected";
  }

  function renderLanguageBreakdown(selection){
    let selected=getSelectedCommits(selection);
    let container=document.getElementById("language-breakdown");
    container.innerHTML="";

    if(selected.length===0) return;

    let lines=selected.flatMap(d=>d.lines);
    let breakdown=d3.rollup(lines,values=>values.length,d=>d.type);

    for(let [language,count] of breakdown){
      let formatted=d3.format(".1~%")(count/lines.length);
      container.innerHTML+=`<dt>${language}</dt><dd>${count} lines (${formatted})</dd>`;
    }
  }

  function brushed(event){
    brushSelection=event.selection;
    dots
      .selectAll("circle")
      .classed("selected",d=>isCommitSelected(brushSelection,d));

    renderSelectionCount(brushSelection);
    renderLanguageBreakdown(brushSelection);
  }

  let brush=d3
    .brush()
    .extent([
      [usableArea.left,usableArea.top],
      [usableArea.right,usableArea.bottom],
    ])
    .on("start brush end",brushed);

  svg.call(brush);
  svg.selectAll(".dots, .overlay ~ *").raise();
}

let data=await loadData();
let commits=processCommits(data);

renderCommitInfo(data,commits);
renderScatterPlot(commits);
