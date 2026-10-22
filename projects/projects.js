import {fetchJSON,renderProjects} from "../global.js";

let projects=await fetchJSON("../lib/projects.json");
let projectsContainer=document.querySelector(".projects");
let projectsTitle=document.querySelector(".projects-title");

renderProjects(projects || [],projectsContainer,"h2");

if(projectsTitle){
  // This changes automatically when another project is added to the JSON file.
  projectsTitle.textContent=`${projects?.length || 0} Projects`;
}
