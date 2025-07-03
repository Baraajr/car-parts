const supertest = require('supertest');
const app = require('../../app');

let categoryId;
let adminToken;
let userToken;

beforeEach(async () => {
  const adminUser = await createAdminUser();
  adminToken = createJWTToken(adminUser._id);

  const category = await createCategory();
  categoryId = category._id;
});

describe('Testing subCategory routes ', () => {
  describe('/api/v1/subCategories', () => {
    describe('GET', () => {
      it('should return an array of subCategories', async () => {
        const response = await supertest(app).get('/api/v1/subCategories');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBeTruthy();
      });
    });

    describe('POST', () => {
      describe('without a login token', () => {
        it('should return 401 Unauthorized', async () => {
          const response = await supertest(app)
            .post('/api/v1/subCategories')
            .send({
              name: 'test subcategory',
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
            .post('/api/v1/subCategories')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              name: 'test subcategory',
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
              .post('/api/v1/subCategories')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'test subcategory',
                category: categoryId,
              });

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty(
              'name',
              'test subcategory',
            );
          });
        });

        describe('with missing name', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/subCategories')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                category: categoryId,
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'subCategory name required',
            );
          });
        });

        describe('with short name', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/subCategories')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'a',
                category: categoryId,
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'Too short subCategory name',
            );
          });
        });
      });
    });
  });

  describe('/api/v1/subCategories/:id', () => {
    describe('GET', () => {
      describe('with valid id', () => {
        it('should return a single subCategory', async () => {
          const newSubCategory = await createSubCategory(categoryId);
          const response = await supertest(app).get(
            `/api/v1/subCategories/${newSubCategory._id}`,
          );
          expect(response.status).toBe(200);
          expect(response.body.data).toHaveProperty('name', 'test subCategory');
        });
      });
      describe('with invalid id', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app).get(
            '/api/v1/subCategories/invalidId',
          );
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid subCategory id');
        });
      });
      describe('with non-existing id', () => {
        it('should return 404 Not Found', async () => {
          const response = await supertest(app).get(
            '/api/v1/subCategories/646f3b0c4d5e8a3d4c8b4567',
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
        it('should update the subCategory', async () => {
          const newSubCategory = await createSubCategory(categoryId);
          const response = await supertest(app)
            .patch(`/api/v1/subCategories/${newSubCategory._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated subCategory',
            });
          expect(response.status).toBe(200);
          expect(response.body.data).toHaveProperty(
            'name',
            'Updated subCategory',
          );
        });
      });

      describe('with invalid id', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .patch('/api/v1/subCategories/invalidId')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated subCategory',
            });
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid subCategory id');
        });
      });

      describe('with non-existing id', () => {
        it('should return 404 Not Found', async () => {
          const response = await supertest(app)
            .patch('/api/v1/subCategories/646f3b0c4d5e8a3d4c8b4567')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated subCategory',
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

          const response = await supertest(app)
            .patch(`/api/v1/subCategories/646f3b0c4d5e8a3d4c8b4567`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              name: 'Updated subSategory',
            });
          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with missing token', () => {
        it('should return 401 Unauthorized', async () => {
          const response = await supertest(app)
            .patch(`/api/v1/subCategories/646f3b0c4d5e8a3d4c8b4567`)
            .send({
              name: 'Updated subCategory',
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
        it('should delete the subCategory', async () => {
          const newSubCategory = await createSubCategory(categoryId);
          const response = await supertest(app)
            .delete(`/api/v1/subCategories/${newSubCategory._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(204);
        });
      });

      describe('with invalid id', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .delete('/api/v1/subCategories/invalidId')
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid subCategory id');
        });
      });

      describe('with non-existing id', () => {
        it('should return 404 Not Found', async () => {
          const response = await supertest(app)
            .delete('/api/v1/subCategories/646f3b0c4d5e8a3d4c8b4567')
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

          const response = await supertest(app)
            .delete(`/api/v1/subCategories/$646f3b0c4d5e8a3d4c8b4567`)
            .set('Authorization', `Bearer ${userToken}`);
          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with missing token', () => {
        it('should return 401 Unauthorized', async () => {
          const response = await supertest(app).delete(
            `/api/v1/subCategories/$646f3b0c4d5e8a3d4c8b4567`,
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
