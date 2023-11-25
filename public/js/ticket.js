
async function updateTicketPage() {
  var rideresponse = await fetch("/api/ticket-information");;
  var rideinfo = await rideresponse.json();
  console.log(rideinfo);

  var newHTML = '';
  for (var ride of rideinfo) {
    var title = ride[0];
    var ticket_cost = ride[1];
    var cardTemplate = `
        <div class="ticket shadow me-2 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
        <rect width="100%" height="100%" fill="#e0e0e0"/>
        <text x="50%" y="30%" font-size="20" text-anchor="middle" fill="#000">${title}</text>

        <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; justify-content: center; align-items: center; height: 100%;">
            ${yourTicketSvg}
            </div>
        </foreignObject>
        <text x="50%" y="80%" font-size="18" text-anchor="middle" fill="#000">$${ticket_cost}.00</text>
        </svg>

        </div>
    `
    newHTML += cardTemplate
  }

  document.getElementById("ride-list").innerHTML = newHTML;
}  

// Replace 'yourTicketSvg' with the actual SVG content as a string
const yourTicketSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-ticket-fill" viewBox="0 0 16 16">
  <path d="M1.5 3A1.5 1.5 0 0 0 0 4.5V6a.5.5 0 0 0 .5.5 1.5 1.5 0 1 1 0 3 .5.5 0 0 0-.5.5v1.5A1.5 1.5 0 0 0 1.5 13h13a1.5 1.5 0 0 0 1.5-1.5V10a.5.5 0 0 0-.5-.5 1.5 1.5 0 0 1 0-3A.5.5 0 0 0 16 6V4.5A1.5 1.5 0 0 0 14.5 3z"/>
</svg>`;

updateTicketPage();
