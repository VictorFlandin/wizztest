const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const { Op } = require('sequelize');
const db = require('./models');

function fetchData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('Failed to parse JSON'));
          }
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

const app = express();

app.use(bodyParser.json());
app.use(express.static(`${__dirname}/static`));

app.get('/api/games', (req, res) => db.Game.findAll()
  .then((games) => res.send(games))
  .catch((err) => {
    console.log('There was an error querying games', JSON.stringify(err));
    return res.send(err);
  }));

app.post('/api/games', (req, res) => {
  const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
  return db.Game.create({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
    .then((game) => res.send(game))
    .catch((err) => {
      console.log('***There was an error creating a game', JSON.stringify(err));
      return res.status(400).send(err);
    });
});

app.delete('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then((game) => game.destroy({ force: true }))
    .then(() => res.send({ id }))
    .catch((err) => {
      console.log('***Error deleting game', JSON.stringify(err));
      res.status(400).send(err);
    });
});

app.put('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then((game) => {
      const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
      return game.update({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
        .then(() => res.send(game))
        .catch((err) => {
          console.log('***Error updating game', JSON.stringify(err));
          res.status(400).send(err);
        });
    });
});

// Search Feature
app.post('/api/games/search', (req, res) => {
  const { name, platform } = req.body;

  return db.Game.findAll({ where:
    {
      name: {
        [Op.like]: `%${name}%`,
      },
      ...(platform ? { platform } : {}),
    } })
    .then((game) => res.send(game))
    .catch((err) => {
      console.log('***There was an error searching games', JSON.stringify(err));
      return res.status(400).send(err);
    });
});

app.post('/api/games/populate', async (req, res) => {
  const urlToFetch = ['https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/android.top100.json',
    'https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/ios.top100.json'];

  const [result1, result2] = await Promise.all(urlToFetch.map((url) => fetchData(url)));
  const mappedResult = [...result1, ...result2].map((el) => ({
    publisherId: el[0].publisher_id,
    name: el[0].name,
    platform: el[0].os,
    storeId: el[0].id,
    bundleId: el[0].bundle_id,
    appVersion: el[0].version,
    isPublished: true,
  }));

  return db.Game.bulkCreate(mappedResult, { updateOnDuplicate: false })
    .then(() => res.send('OK'))
    .catch((err) => {
      console.log('***There was an error retreiving games', JSON.stringify(err));
      return res.status(400).send('KO');
    });
});

app.listen(3000, () => {
  console.log('Server is up on port 3000');
});

module.exports = app;
