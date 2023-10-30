function displayJSONData() {
    // Fetch your JSON data from a URL or local file
    fetch("visitorData.json")
        .then(response => response.json())
        .then(data => {
            const table = document.getElementById("json-display");

            // Clear existing table rows
            while (table.rows.length > 1) {
                table.deleteRow(1);
            }

            // Populate the table with JSON data
            data.forEach(item => {
                const row = table.insertRow();
                const visitorIDCell = row.insertCell(0);
                const wristbandIDCell = row.insertCell(1);
                const firstNameCell = row.insertCell(2);
                const lastNameCell = row.insertCell(3);
                const phoneCell = row.insertCell(4);
                const emergencyCell = row.insertCell(5);
                const ageCell = row.insertCell(6);
                const ticketTypeCell = row.insertCell(7);

                visitorIDCell.innerText = item.visitor_ID;
                wristbandIDCell.innerText = item.wristband_ID;
                firstNameCell.innerText = item.first_name;
                lastNameCell.innerText = item.last_name;
                phoneCell.innerText = item.contact_information;
                emergencyCell.innerText = item.emergency_contact;
                ageCell.innerText = item.age;
                ticketTypeCell.innerText = item.ticket_type;
            });
        })
        .catch(error => console.error("Error fetching JSON data: ", error));
}
