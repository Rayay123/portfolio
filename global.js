console.log("IT'S ALIVE!");

function $$(selector,context=document){
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH=(location.hostname==="localhost" || location.hostname==="127.0.0.1")
  ? "/"
  : "/portfolio/";

let pages=[
  {url:"",title:"Home"},
  {url:"projects/",title:"Projects"},
  {url:"contact/",title:"Contact"},
  {url:"resume/",title:"Resume"},
  {url:"https://github.com/Rayay123",title:"GitHub"},
];

let nav=document.createElement("nav");
nav.setAttribute("aria-label","Primary navigation");
document.querySelector(".site-header")?.append(nav);

for(let page of pages){
  let url=page.url;
  let title=page.title;

  url=!url.startsWith("http") ? BASE_PATH+url : url;

  let a=document.createElement("a");
  a.href=url;
  a.textContent=title;

  if(a.host===location.host && a.pathname===location.pathname){
    a.classList.add("current");
    a.setAttribute("aria-current","page");
  }

  if(a.host!==location.host){
    a.target="_blank";
    a.rel="noreferrer";
  }

  nav.append(a);
}

document.body.insertAdjacentHTML(
  "afterbegin",
  `<label class="color-scheme">
    Theme:
    <select aria-label="Choose color theme">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>`,
);

let select=document.querySelector(".color-scheme select");

function setColorScheme(colorScheme){
  document.documentElement.style.setProperty("color-scheme",colorScheme);
  select.value=colorScheme;
}

if("colorScheme" in localStorage){
  setColorScheme(localStorage.colorScheme);
}

select.addEventListener("input",event=>{
  let colorScheme=event.target.value;
  setColorScheme(colorScheme);
  localStorage.colorScheme=colorScheme;
});

export async function fetchJSON(url){
  try{
    // This works for both my JSON file and the GitHub API.
    let response=await fetch(url);

    if(!response.ok){
      throw new Error(`Could not load data: ${response.statusText}`);
    }

    return await response.json();
  }catch(error){
    console.error("Error fetching or parsing JSON data:",error);
    return null;
  }
}

function projectPath(path){
  if(!path || path.startsWith("http")) return path;
  return BASE_PATH+path.replace(/^\//,"");
}

export function renderProjects(projects,containerElement,headingLevel="h2"){
  if(!containerElement) return;

  // Clear the old cards before making the new ones.
  containerElement.innerHTML="";

  if(!Array.isArray(projects) || projects.length===0){
    containerElement.innerHTML="<p>No projects to show right now.</p>";
    return;
  }

  if(!/^h[1-6]$/.test(headingLevel)) headingLevel="h2";

  for(let project of projects){
    let article=document.createElement("article");
    article.className="project-card";

    let projectTitle=project.url
      ? `<a href="${projectPath(project.url)}">${project.title}</a>`
      : project.title;

    article.innerHTML=`
      <div>
        <p class="project-year">${project.year}</p>
        <${headingLevel}>${projectTitle}</${headingLevel}>
      </div>
      <img src="${projectPath(project.image)}" alt="${project.title}">
      <p>${project.description}</p>
    `;

    containerElement.appendChild(article);
  }
}

export async function fetchGithubData(username){
  return fetchJSON(`https://api.github.com/users/${username}`);
}

