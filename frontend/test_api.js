const axios = require('axios');
axios.get('http://localhost:8000/api/v1/dropdowns/')
  .then(res => console.log("Success! Fabric types:", res.data.fabric_type_master))
  .catch(err => console.error("Error:", err.message));
