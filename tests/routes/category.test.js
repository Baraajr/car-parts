const supertest = require('supertest');
const app = require('../../app');

let adminToken;
let userToken;

beforeEach(async () => {
  const adminUser = await createAdminUser();
  adminToken = createJWTToken(adminUser._id);
});

describe('Testing cateory routes ', () => {
  describe('/api/v1/cateories', () => {
    describe('GET', () => {
      it('should return an array of cateories', async () => {
        const response = await supertest(app).get('/api/v1/categories');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBeTruthy();
      });
    });

    describe('POST', () => {
      describe('without a login token', () => {
        it('should return 401 Unauthorized', async () => {
          const response = await supertest(app)
            .post('/api/v1/categories')
            .send({
              name: 'Test Category',
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
            .post('/api/v1/categories')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              name: 'Test Category',
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
              .post('/api/v1/categories')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'test category',
              });

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('name', 'test category');
          });
        });

        describe('with missing name', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/categories')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('category name required');
          });
        });

        describe('with short name', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/categories')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'ab',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Too short category name');
          });
        });

        describe('with duplicate name', () => {
          it('should Return 400 ', async () => {
            await createCategory();
            const response = await supertest(app)
              .post('/api/v1/categories')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Category',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(
              /Duplicate field name: 'Test Category'. Please use another valu/i,
            );
          });
        });
      });
    });
  });

  describe('/api/v1/categories/:id', () => {
    describe('GET', () => {
      describe('with valid id', () => {
        it('should return a single category', async () => {
          const newCategory = await createCategory();
          const response = await supertest(app).get(
            `/api/v1/categories/${newCategory._id}`,
          );
          expect(response.status).toBe(200);
          expect(response.body.data).toHaveProperty('name', 'Test Category');
        });
      });
      describe('with invalid id', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app).get(
            '/api/v1/categories/invalidId',
          );
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid category id');
        });
      });
      describe('with non-existing id', () => {
        it('should return 404 Not Found', async () => {
          const response = await supertest(app).get(
            '/api/v1/categories/646f3b0c4d5e8a3d4c8b4567',
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
        it('should update the category', async () => {
          const newCategory = await createCategory();
          const response = await supertest(app)
            .patch(`/api/v1/categories/${newCategory._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Category',
            });
          expect(response.status).toBe(200);
          expect(response.body.data).toHaveProperty('name', 'Updated Category');
        });
      });

      describe('with invalid id', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .patch('/api/v1/categories/invalidId')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
            });
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid category id');
        });
      });

      describe('with non-existing id', () => {
        it('should return 404 Not Found', async () => {
          const response = await supertest(app)
            .patch('/api/v1/categories/646f3b0c4d5e8a3d4c8b4567')
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

          const newCategory = await createCategory();
          const response = await supertest(app)
            .patch(`/api/v1/categories/${newCategory._id}`)
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
          const newCategory = await createCategory();
          const response = await supertest(app)
            .patch(`/api/v1/categories/${newCategory._id}`)
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
        it('should delete the category', async () => {
          const newCategory = await createCategory();
          const response = await supertest(app)
            .delete(`/api/v1/categories/${newCategory._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(204);
        });
      });

      describe('with invalid id', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .delete('/api/v1/categories/invalidId')
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid category id');
        });
      });

      describe('with non-existing id', () => {
        it('should return 404 Not Found', async () => {
          const response = await supertest(app)
            .delete('/api/v1/categories/646f3b0c4d5e8a3d4c8b4567')
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

          const newCategory = await createCategory();
          const response = await supertest(app)
            .delete(`/api/v1/categories/${newCategory._id}`)
            .set('Authorization', `Bearer ${userToken}`);

          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with missing token', () => {
        it('should return 401 Unauthorized', async () => {
          const newCategory = await createCategory();

          const response = await supertest(app).delete(
            `/api/v1/categories/${newCategory._id}`,
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
