const supertest = require('supertest');
const app = require('../../app');

let adminToken;
let userToken;

beforeEach(async () => {
  const adminUser = await createAdminUser();
  adminToken = createJWTToken(adminUser._id);
});

describe('Testing brand routes ', () => {
  describe('/api/v1/brands', () => {
    describe('GET', () => {
      it('should return an array of brands', async () => {
        const response = await supertest(app).get('/api/v1/brands');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBeTruthy();
      });
    });

    describe('POST', () => {
      describe('without a login token', () => {
        it('should return 401 Unauthorized', async () => {
          const response = await supertest(app).post('/api/v1/brands').send({
            name: 'test brand',
          });
          expect(response.status).toBe(401);
          expect(response.body.message).toBe(
            'You are not logged in. Please log in to get access.',
          );
        });
      });

      describe('with regular user token', () => {
        it('Should returns 403 Forbidden', async () => {
          const regularUser = await createReqularUser();
          userToken = createJWTToken(regularUser._id);

          const response = await supertest(app)
            .post('/api/v1/brands')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              name: 'test brand',
            });

          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with Admin token', () => {
        describe('with all required fields', () => {
          it('should Return 201 Created', async () => {
            const response = await supertest(app)
              .post('/api/v1/brands')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'test brand',
              });

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('name', 'test brand');
          });
        });

        describe('with missing name', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/brands')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Brand name required');
          });
        });

        describe('with short name', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/brands')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'a',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Too short Brand name');
          });
        });

        describe('with duplicate name', () => {
          it('should return 400 Bad Request', async () => {
            await createBrand();
            const response = await supertest(app)
              .post('/api/v1/brands')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'test brand',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(
              /Duplicate field name: 'test brand'./i,
            );
          });
        });
      });
    });
  });

  describe('/api/v1/brands/:id', () => {
    describe('GET', () => {
      describe('with valid id', () => {
        it('should return a single brand', async () => {
          const newBrand = await createBrand();
          const response = await supertest(app).get(
            `/api/v1/brands/${newBrand._id}`,
          );
          expect(response.status).toBe(200);
          expect(response.body.data).toHaveProperty('name', 'test brand');
        });
      });
      describe('with invalid id', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app).get('/api/v1/brands/invalidId');
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid Brand id');
        });
      });
      describe('with non-existing id', () => {
        it('should return 404 Not Found', async () => {
          const response = await supertest(app).get(
            '/api/v1/brands/646f3b0c4d5e8a3d4c8b4567',
          );
          expect(response.status).toBe(404);
          expect(response.body.message).toBe(
            'No Document with this ID 646f3b0c4d5e8a3d4c8b4567',
          );
        });
      });
    });

    describe('PATCH', () => {
      describe('with valid id', () => {
        it('should update the brand', async () => {
          const newBrand = await createBrand();
          const response = await supertest(app)
            .patch(`/api/v1/brands/${newBrand._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated brand',
            });
          expect(response.status).toBe(200);
          expect(response.body.data).toHaveProperty('name', 'Updated brand');
        });
      });

      describe('with invalid id', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .patch('/api/v1/brands/invalidId')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
            });
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid Brand id');
        });
      });

      describe('with non-existing id', () => {
        it('should return 404 Not Found', async () => {
          const response = await supertest(app)
            .patch('/api/v1/brands/646f3b0c4d5e8a3d4c8b4567')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
            });
          expect(response.status).toBe(404);
          expect(response.body.message).toBe(
            'No document with this ID 646f3b0c4d5e8a3d4c8b4567',
          );
        });
      });

      describe('with regular user token', () => {
        it('should return 403 Forbidden', async () => {
          const regularUser = await createReqularUser();
          userToken = createJWTToken(regularUser._id);

          const newBrand = await createBrand();
          const response = await supertest(app)
            .patch(`/api/v1/brands/${newBrand._id}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              name: 'Updated Product',
            });
          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with missing token', () => {
        it('should return 401 Unauthorized', async () => {
          const newBrand = await createBrand();
          const response = await supertest(app)
            .patch(`/api/v1/brands/${newBrand._id}`)
            .send({
              name: 'Updated Product',
            });
          expect(response.status).toBe(401);
          expect(response.body.message).toBe(
            'You are not logged in. Please log in to get access.',
          );
        });
      });
    });

    describe('DELETE', () => {
      describe('with valid id', () => {
        it('should delete the brand', async () => {
          const newBrand = await createBrand();
          const response = await supertest(app)
            .delete(`/api/v1/brands/${newBrand._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(204);
        });
      });

      describe('with invalid id', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .delete('/api/v1/brands/invalidId')
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid Brand id');
        });
      });

      describe('with non-existing id', () => {
        it('should return 404 Not Found', async () => {
          const response = await supertest(app)
            .delete('/api/v1/brands/646f3b0c4d5e8a3d4c8b4567')
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(404);
          expect(response.body.message).toBe(
            'No document with this ID 646f3b0c4d5e8a3d4c8b4567',
          );
        });
      });

      describe('with regular user token', () => {
        it('should return 403 Forbidden', async () => {
          const regularUser = await createReqularUser();
          userToken = createJWTToken(regularUser._id);
          const newBrand = await createBrand();
          const response = await supertest(app)
            .delete(`/api/v1/brands/${newBrand._id}`)
            .set('Authorization', `Bearer ${userToken}`);
          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with missing token', () => {
        it('should return 401 Unauthorized', async () => {
          const newBrand = await createBrand();
          const response = await supertest(app).delete(
            `/api/v1/brands/${newBrand._id}`,
          );
          expect(response.status).toBe(401);
          expect(response.body.message).toBe(
            'You are not logged in. Please log in to get access.',
          );
        });
      });
    });
  });
});
