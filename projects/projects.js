import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import {fetchJSON,renderProjects} from "../global.js";

let projects=await fetchJSON("../lib/projects.json") || [];
let projectsContainer=document.querySelector(".projects");
let projectsTitle=document.querySelector(".projects-title");
let searchInput=document.querySelector(".searchBar");
let query="";
let selectedYear=null;

let colors=d3.scaleOrdinal(d3.schemeTableau10);
let arcGenerator=d3.arc().innerRadius(0).outerRadius(50);
let sliceGenerator=d3.pie().value(d=>d.value);

function searchedProjects(){
  return projects.filter(project=>{
    let values=Object.values(project).join("\n").toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function visibleProjects(){
  let matches=searchedProjects();

  if(selectedYear!==null){
    matches=matches.filter(project=>String(project.year)===selectedYear);
  }

  return matches;
}

function updateProjectCards(){
  let visible=visibleProjects();
  renderProjects(visible,projectsContainer,"h2");

  if(projectsTitle){
    projectsTitle.textContent=`${visible.length} Project${visible.length===1 ? "" : "s"}`;
  }
}

function selectYear(year){
  selectedYear=selectedYear===year ? null : year;
  renderPieChart(searchedProjects());
  updateProjectCards();
}

function renderPieChart(projectsGiven){
  let rolledData=d3.rollups(
    projectsGiven,
    values=>values.length,
    project=>String(project.year),
  );

  rolledData.sort((a,b)=>b[0].localeCompare(a[0]));

  let data=rolledData.map(([year,count])=>({
    value:count,
    label:year,
  }));

  // If a search removes the selected year, reset the year filter.
  if(selectedYear!==null && !data.some(d=>d.label===selectedYear)){
    selectedYear=null;
  }

  colors.domain(data.map(d=>d.label));
  let arcData=sliceGenerator(data);
  let svg=d3.select("#projects-pie-plot");
  let legend=d3.select(".legend");

  svg.selectAll("path").remove();
  legend.selectAll("li").remove();

  svg
    .selectAll("path")
    .data(arcData)
    .join("path")
    .attr("d",arcGenerator)
    .attr("fill",d=>colors(d.data.label))
    .attr("class",d=>d.data.label===selectedYear ? "selected" : null)
    .attr("tabindex",0)
    .attr("role","button")
    .attr("aria-label",d=>`${d.data.label}: ${d.data.value} project${d.data.value===1 ? "" : "s"}`)
    .attr("aria-pressed",d=>d.data.label===selectedYear)
    .on("click",(_,d)=>selectYear(d.data.label))
    .on("keydown",(event,d)=>{
      if(event.key==="Enter" || event.key===" "){
        event.preventDefault();
        selectYear(d.data.label);
      }
    });

  legend
    .selectAll("li")
    .data(data)
    .join("li")
    .attr("style",d=>`--color:${colors(d.label)}`)
    .attr("class",d=>`legend-item${d.label===selectedYear ? " selected" : ""}`)
    .attr("tabindex",0)
    .attr("role","button")
    .attr("aria-pressed",d=>d.label===selectedYear)
    .html(d=>`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
    .on("click",(_,d)=>selectYear(d.label))
    .on("keydown",(event,d)=>{
      if(event.key==="Enter" || event.key===" "){
        event.preventDefault();
        selectYear(d.label);
      }
    });
}

renderPieChart(projects);
updateProjectCards();

searchInput?.addEventListener("input",event=>{
  query=event.target.value;
  renderPieChart(searchedProjects());
  updateProjectCards();
});
