import {fetchGithubData,fetchJSON,renderProjects} from "./global.js";

let projects=await fetchJSON("./lib/projects.json");
// The first three objects are the projects shown on the home page.
let latestProjects=(projects || []).slice(0,3);
let projectsContainer=document.querySelector(".projects");

renderProjects(latestProjects,projectsContainer,"h3");

// GitHub lets me load these public numbers without an API key.
let githubData=await fetchGithubData("Rayay123");
let profileStats=document.querySelector("#profile-stats");

if(profileStats && githubData){
  profileStats.innerHTML=`
    <dl>
      <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
      <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
      <dt>Followers</dt><dd>${githubData.followers}</dd>
      <dt>Following</dt><dd>${githubData.following}</dd>
    </dl>
  `;
}else if(profileStats){
  profileStats.textContent="GitHub stats could not be loaded.";
}
