const form=document.querySelector("form");
const status=document.querySelector("#form-status");

form.addEventListener("submit",event=>{
  event.preventDefault();
  const data=new FormData(form);
  const email=data.get("email").trim();
  const subject=data.get("subject").trim();
  const message=data.get("body").trim();
  const body=`From: ${email}\n\n${message}`;
  const gmail=new URL("https://mail.google.com/mail/");
  gmail.searchParams.set("view","cm");
  gmail.searchParams.set("fs","1");
  gmail.searchParams.set("to","rtaneka@ucsd.edu");
  gmail.searchParams.set("su",subject);
  gmail.searchParams.set("body",body);
  const link=document.createElement("a");
  link.href=gmail;
  link.target="_blank";
  link.rel="noopener";
  link.click();
  status.textContent="A Gmail draft should now be open in a new tab.";
});
