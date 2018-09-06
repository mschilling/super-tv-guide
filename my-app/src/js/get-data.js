
function getShow(id){
  // API request
  var request = 'https://jsonplaceholder.typicode.com/todos/' + id; // TODO: Change URL to the API

  // Fetch the JSON data from the API
  fetch(request).then(response => {
    return response.json();
  }).then(data => {
    // Use 'data' variable .property to get a property.
    console.log(data);
  }).catch(err => {
    // Do something for an error here
  });
}

function getShows(userID){

  // API request
  var request = 'https://jsonplaceholder.typicode.com/posts/' + userID; // TODO: Change URL to the API api/users/shows/userid or something

  // Fetch the JSON data from the API
  fetch(request).then(response => {
    return response.json();
  }).then(data => {
    return data;
  }).catch(err => {
    // Do something for an error here
  });
}

function findShow(searchTerm){
  // API request
  var request = 'api/search?r=' + searchTerm; // TODO: Change URL to the API

  // Fetch the JSON data from the API
  fetch(request).then(response => {
    return response.json();
  }).then(data => {
    // Do something with the data
  }).catch(err => {
    // Do something for an error here
  });
}
