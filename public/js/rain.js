function rainoutTrigger() {
    fetch('/api/get-today-rainout')  // Adjust the API endpoint accordingly
    .then(response => response.json())
    .then(data => {
      if (data.isRainoutToday) {
        // Show the rainout alert
        document.getElementById('rainoutAlert').style.display = 'block';
      }
    })
    .catch(error => {
      console.error('Error fetching rainout information:', error);
    });
  }
  rainoutTrigger()