const path = require('path');
const express = require('express');
const app = express();

const port = process.env.PORT || 3000;

app.use('/assets', express.static('assets'));

app.get('/', (req, res) => {
  var options = {
    root: __dirname,
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true,
    },
  };
  res.sendFile('./index.html', options);
});

app.listen(port, () =>
  console.log(`App available at http://localhost:${port}`)
);
