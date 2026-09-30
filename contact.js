const form = document.querySelector("form");
const statusMessage = document.querySelector("#form-status");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const sender = formData.get("email").trim();
  const subject = formData.get("subject").trim();
  const message = formData.get("body").trim();
  const body = `From: ${sender}\n\n${message}`;

  const gmailURL = new URL("https://mail.google.com/mail/");
  gmailURL.searchParams.set("view", "cm");
  gmailURL.searchParams.set("fs", "1");
  gmailURL.searchParams.set("to", "rtaneka@ucsd.edu");
  gmailURL.searchParams.set("su", subject);
  gmailURL.searchParams.set("body", body);

  const composeLink = document.createElement("a");
  composeLink.href = gmailURL;
  composeLink.target = "_blank";
  composeLink.rel = "noopener";
  composeLink.click();

  statusMessage.textContent = "A Gmail draft should now be open in a new tab.";
});
