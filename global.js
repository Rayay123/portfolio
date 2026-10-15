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

