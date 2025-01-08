const request = require('supertest');
const assert = require('assert');
const app = require('../index');

// TODO Seed

it('should respond with json containing search parameters', (done) => {
  const data = {
    name: 'Test App',
    platform: 'android',
  };

  request(app).post('/api/games/search')
    .send(data)
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200)
    .end((err, result) => {
      if (err) return done(err);
      console.log(result.body);
      assert.strictEqual(result.body.length, 1);
      assert.strictEqual(result.body[0].name, 'Test App');
      assert.strictEqual(result.body[0].platform, 'android');
      done();
    });
});

it('should search with partial parameters', (done) => {
  const data = {
    name: 'st Ap',
    platform: 'android',
  };

  request(app).post('/api/games/search')
    .send(data)
    .set('Accept', 'application/json')
    .expect(200)
    .end((err, result) => {
      if (err) return done(err);
      assert.strictEqual(result.body.length, 1);
      assert.strictEqual(result.body[0].name, 'Test App');
      assert.strictEqual(result.body[0].platform, 'android');
      done();
    });
});

it('should match all names if not provided', (done) => {
  const data = {
    name: '',
    platform: 'android',
  };

  request(app).post('/api/games/search')
    .send(data)
    .set('Accept', 'application/json')
    .expect(200)
    .end((err, result) => {
      if (err) return done(err);
      assert.strictEqual(result.body.length, 1);
      done();
    });
});
